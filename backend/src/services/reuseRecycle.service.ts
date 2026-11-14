import prisma from '../utils/prisma';
import { AppError, validationError } from '../utils/errors';
import { awardEcoPoints } from './eco.service';

type ListingType = 'REUSE' | 'SELL' | 'DONATE';
type ListingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type RecyclingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED';

const listingTypes: ListingType[] = ['REUSE', 'SELL', 'DONATE'];

class ReuseRecycleService {
  async listListings(type?: string) {
    if (type && !listingTypes.includes(type as ListingType)) {
      throw validationError({ type: 'Invalid listing type.' });
    }

    return prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        ...(type ? { type: type as any } : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        offers: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getListing(id: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        offers: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404, 'LISTING_NOT_FOUND');
    }

    return listing;
  }

  async createListing(
    userId: string,
    input: {
      title: string;
      description?: string;
      category: string;
      condition?: string;
      imageUrl?: string;
      itemId?: string;
      type: ListingType;
      price?: number;
    },
  ) {
    const {
      title,
      description,
      category,
      condition,
      imageUrl,
      itemId,
      type,
      price,
    } = input;

    if (!title?.trim()) {
      throw validationError({ title: 'Title is required.' });
    }

    if (!category?.trim()) {
      throw validationError({ category: 'Category is required.' });
    }

    if (!listingTypes.includes(type)) {
      throw validationError({ type: 'Invalid listing type.' });
    }

    if (type === 'SELL' && (price === undefined || price <= 0)) {
      throw validationError({
        price: 'A selling price greater than zero is required.',
      });
    }

    if (price !== undefined && price < 0) {
      throw validationError({ price: 'Price cannot be negative.' });
    }

    return prisma.listing.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        category: category.trim(),
        condition,
        imageUrl,
        itemId: itemId || null,
        type: type as any,
        price: type === 'SELL' ? price : null,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async createOffer(
    buyerId: string,
    listingId: string,
    input: {
      amount?: number;
      message?: string;
    },
  ) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404, 'LISTING_NOT_FOUND');
    }

    if (listing.status !== 'ACTIVE') {
      throw new AppError('This listing is no longer available.', 400);
    }

    if (listing.ownerId === buyerId) {
      throw new AppError('You cannot make an offer on your own listing.', 400);
    }

    if (
      listing.type === 'SELL' &&
      (input.amount === undefined || input.amount <= 0)
    ) {
      throw validationError({
        amount: 'Enter a valid offer amount.',
      });
    }

    if (input.amount !== undefined && input.amount < 0) {
      throw validationError({ amount: 'Offer amount cannot be negative.' });
    }

    return prisma.offer.create({
      data: {
        listingId,
        buyerId,
        amount: input.amount,
        message: input.message?.trim(),
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
          },
        },
        listing: true,
      },
    });
  }

  async getOffersForListing(userId: string, listingId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404);
    }

    if (listing.ownerId !== userId) {
      throw new AppError('You are not allowed to view these offers.', 403);
    }

    return prisma.offer.findMany({
      where: { listingId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async respondToOffer(
    ownerId: string,
    offerId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      throw validationError({ status: 'Invalid offer response.' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: true,
      },
    });

    if (!offer) {
      throw new AppError('Offer not found.', 404);
    }

    if (offer.listing.ownerId !== ownerId) {
      throw new AppError('You cannot respond to this offer.', 403);
    }

    if (offer.status !== 'PENDING') {
      throw new AppError('This offer has already been handled.', 400);
    }

    if (offer.listing.status !== 'ACTIVE') {
      throw new AppError('This listing is no longer available.', 400);
    }

    if (status === 'REJECTED') {
      return prisma.offer.update({
        where: { id: offerId },
        data: { status: 'REJECTED' },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED' },
      });

      await tx.listing.update({
        where: { id: offer.listingId },
        data: { status: 'COMPLETED' },
      });

      const transaction = await tx.transaction.create({
        data: {
          listingId: offer.listingId,
          offerId: offer.id,
          fromUserId: ownerId,
          toUserId: offer.buyerId,
        },
      });

      await tx.offer.updateMany({
        where: {
          listingId: offer.listingId,
          id: { not: offerId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      });

      return {
        offer: updatedOffer,
        transaction,
      };
    });

    await awardEcoPoints(
      ownerId,
      offer.listing.type as any,
      offer.listingId,
    );

    return result;
  }

  async createRecyclingRequest(
    ownerId: string,
    input: {
      itemId?: string;
      itemName: string;
      category: string;
      quantity?: number;
      pickupAddress: string;
      notes?: string;
    },
  ) {
    if (!input.itemName?.trim()) {
      throw validationError({ itemName: 'Item name is required.' });
    }

    if (!input.category?.trim()) {
      throw validationError({ category: 'Category is required.' });
    }

    if (!input.pickupAddress?.trim()) {
      throw validationError({ pickupAddress: 'Pickup address is required.' });
    }

    if (input.quantity !== undefined && input.quantity < 1) {
      throw validationError({ quantity: 'Quantity must be at least one.' });
    }

    return prisma.recyclingRequest.create({
      data: {
        ownerId,
        itemId: input.itemId || null,
        itemName: input.itemName.trim(),
        category: input.category.trim(),
        quantity: input.quantity ?? 1,
        pickupAddress: input.pickupAddress.trim(),
        notes: input.notes?.trim(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getMyRecyclingRequests(userId: string, role: string) {
    if (role === 'RECYCLER') {
      return prisma.recyclingRequest.findMany({
        where: {
          OR: [
            { recyclerId: userId },
            {
              recyclerId: null,
              status: 'REQUESTED',
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          recycler: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return prisma.recyclingRequest.findMany({
      where: { ownerId: userId },
      include: {
        recycler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateRecyclingStatus(
    recyclerId: string,
    requestId: string,
    status: 'ACCEPTED' | 'COLLECTED' | 'COMPLETED',
  ) {
    const request = await prisma.recyclingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Recycling request not found.', 404);
    }

    if (status === 'ACCEPTED') {
      if (request.status !== 'REQUESTED' || request.recyclerId) {
        throw new AppError('This request is no longer available.', 400);
      }

      return prisma.recyclingRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          recyclerId,
        },
      });
    }

    if (request.recyclerId !== recyclerId) {
      throw new AppError('This request is assigned to another recycler.', 403);
    }

    if (status === 'COLLECTED') {
      if (request.status !== 'ACCEPTED') {
        throw new AppError('Accept the request before collecting it.', 400);
      }

      return prisma.recyclingRequest.update({
        where: { id: requestId },
        data: { status: 'COLLECTED' },
      });
    }

    if (status === 'COMPLETED') {
      if (request.status !== 'COLLECTED') {
        throw new AppError('Collect the item before completing the request.', 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.recyclingRequest.update({
          where: { id: requestId },
          data: { status: 'COMPLETED' },
        });

        const transaction = await tx.transaction.create({
          data: {
            recyclingRequestId: requestId,
            fromUserId: request.ownerId,
            toUserId: recyclerId,
          },
        });

        return { request: updated, transaction };
      });

      await awardEcoPoints(
        request.ownerId,
        'RECYCLE' as any,
        requestId,
      );

      return result;
    }

    throw validationError({ status: 'Invalid recycling status.' });
  }

  async getMyTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
          },
        },
        listing: true,
        offer: true,
        recyclingRequest: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }
}

export const reuseRecycleService = new ReuseRecycleService();