import {
  addDoc,
  getDocs,
  collection,
  doc,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

import { db, auth } from './firebase';
import { fsCall, nowIso } from './firebaseHelpers';
import { notify } from './notification.service';
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

export interface Member5User {
  id: string;
  name: string;
  role?: string;
}

export interface Listing {
  id: string;
  itemId?: string;
  title: string;
  description?: string;
  category: string;
  condition?: string;
  type: ListingType;
  price?: number;
  status: ListingStatus;
  owner: { id: string; name: string };
  createdAt: string;
}

export interface Offer {
  id: string;
  amount?: number;
  message?: string;
  status: OfferStatus;
  buyer?: { name: string };
}

export interface RecyclingRequest {
  id: string;
  itemId?: string;
  itemName: string;
  category: string;
  quantity: number;
  pickupAddress: string;
  notes?: string;
  status: RecyclingStatus;
  owner?: { name: string };
  recycler?: { name: string };
}

export interface Transaction {
  id: string;
  kind: 'LISTING' | 'RECYCLING';
  refId: string;
  fromUserId: string;
  toUserId: string;
  completedAt: string;
  fromUser?: { name: string };
  toUser?: { name: string };
  listing?: { title: string };
  recyclingRequest?: { itemName: string };
}

const listingsRef = collection(db, 'listings');
const offersRef = collection(db, 'offers');
const recyclingRef = collection(db, 'recyclingRequests');
const transactionsRef = collection(db, 'transactions');

const requireUser = (userId: string) => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Please sign in again.');
  }
};

const sortNewest = <T extends { createdAt?: string }>(items: T[]) =>
  items.sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );

const mapListing = (id: string, data: any): Listing => ({
  id,
  itemId: data.itemId,
  title: data.title,
  description: data.description,
  category: data.categoryName ?? '',
  condition: data.condition,
  type: data.type,
  price: data.price,
  status: data.status,
  owner: {
    id: data.ownerId,
    name: data.ownerName ?? '',
  },
  createdAt: data.createdAt ?? '',
});

export const listListings = async (
  type: ListingType,
): Promise<Listing[]> =>
  fsCall(async () => {
    const snapshot = await getDocs(
      query(listingsRef, where('status', '==', 'ACTIVE')),
    );

    return sortNewest(
      snapshot.docs
        .map((d) => mapListing(d.id, d.data()))
        .filter((item) => item.type === type),
    );
  });

export const listMyListings = async (
  userId: string,
): Promise<Listing[]> =>
  fsCall(async () => {
    requireUser(userId);
    const snapshot = await getDocs(
      query(listingsRef, where('ownerId', '==', userId)),
    );

    return sortNewest(
      snapshot.docs.map((d) => mapListing(d.id, d.data())),
    );
  });

export const createListing = async (
  user: Member5User,
  payload: {
    title: string;
    description?: string;
    category: string;
    condition?: string;
    itemId?: string;
    type: ListingType;
    price?: number;
  },
): Promise<void> =>
  fsCall(async () => {
    requireUser(user.id);

    const timestamp = nowIso();

    await addDoc(listingsRef, {
      itemId: payload.itemId || null,
      ownerId: user.id,
      ownerName: user.name,
      type: payload.type,
      title: payload.title,
      description: payload.description ?? '',
      categoryName: payload.category,
      condition: payload.condition ?? '',
      imageUrl: null,
      price: payload.type === 'SELL' ? payload.price : null,
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

export const createOffer = async (
  user: Member5User,
  listing: Listing,
  amount?: number,
  message?: string,
): Promise<void> =>
  fsCall(async () => {
    requireUser(user.id);

    if (listing.owner.id === user.id) {
      throw new Error('You cannot make an offer on your own listing.');
    }

    const timestamp = nowIso();

    await addDoc(offersRef, {
      listingId: listing.id,
      listingTitle: listing.title,
      ownerId: listing.owner.id,
      buyerId: user.id,
      buyerName: user.name,
      amount: amount ?? null,
      message: message ?? '',
      status: 'PENDING',
      createdAt: timestamp,
    });

    await notify(
      listing.owner.id,
      'New offer received',
      `${user.name} made an offer on ${listing.title}.`,
      { type: 'LISTING', refId: listing.id },
    );
  });

export const listOffers = async (
  listingId: string,
  ownerId: string,
): Promise<Offer[]> =>
  fsCall(async () => {
    requireUser(ownerId);

    const snapshot = await getDocs(
      query(offersRef, where('listingId', '==', listingId)),
    );

    return snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          amount: data.amount ?? undefined,
          message: data.message ?? '',
          status: data.status,
          buyer: { name: data.buyerName ?? '' },
          ownerId: data.ownerId,
        };
      })
      .filter((offer: any) => offer.ownerId === ownerId);
  });

export const respondToOffer = async (
  offerId: string,
  ownerId: string,
  status: 'ACCEPTED' | 'REJECTED',
): Promise<void> =>
  fsCall(async () => {
    requireUser(ownerId);

    const offerRef = doc(db, 'offers', offerId);
    const transactionRef = doc(transactionsRef);

    let completedListing: any = null;
    let buyerId = '';
    let listingId = '';

    // Fetch the owner's offers before starting the transaction.
    const ownerOffers = await getDocs(
      query(offersRef, where('ownerId', '==', ownerId)),
    );

    await runTransaction(db, async (tx) => {
      const offerSnapshot = await tx.get(offerRef);

      if (!offerSnapshot.exists()) {
        throw new Error('Offer not found.');
      }

      const offer = offerSnapshot.data();

      if (offer.ownerId !== ownerId || offer.status !== 'PENDING') {
        throw new Error('This offer cannot be processed.');
      }

      buyerId = offer.buyerId;
      listingId = offer.listingId;

      if (status === 'REJECTED') {
        tx.update(offerRef, { status: 'REJECTED' });
        return;
      }

      const listingRef = doc(db, 'listings', listingId);
      const listingSnapshot = await tx.get(listingRef);

      if (!listingSnapshot.exists()) {
        throw new Error('Listing not found.');
      }

      const listing = listingSnapshot.data();

      if (listing.ownerId !== ownerId || listing.status !== 'ACTIVE') {
        throw new Error('This listing is no longer available.');
      }

      completedListing = listing;

      // Accept the selected offer and reject every other pending offer.
      ownerOffers.docs.forEach((otherOffer) => {
        const data = otherOffer.data();

        if (data.listingId === listingId && data.status === 'PENDING') {
          tx.update(otherOffer.ref, {
            status: otherOffer.id === offerId ? 'ACCEPTED' : 'REJECTED',
          });
        }
      });

      tx.update(listingRef, {
        status: 'COMPLETED',
        updatedAt: nowIso(),
      });

      tx.set(transactionRef, {
        kind: 'LISTING',
        refId: listingId,
        fromUserId: ownerId,
        toUserId: buyerId,
        listingTitle: listing.title ?? '',
        completedAt: nowIso(),
      });
    });

    if (status === 'ACCEPTED' && completedListing) {
      await awardEcoPoints(
        ownerId,
        completedListing.type,
        listingId,
        completedListing.categoryName,
      );

      await notify(
        buyerId,
        'Offer accepted',
        `Your offer for ${completedListing.title} was accepted.`,
        { type: 'LISTING', refId: listingId },
      );
    }
  });

const mapRecyclingRequest = (
  id: string,
  data: any,
): RecyclingRequest => ({
  id,
  itemId: data.itemId,
  itemName: data.itemName,
  category: data.categoryName ?? '',
  quantity: data.quantity,
  pickupAddress: data.pickupAddress,
  notes: data.notes,
  status: data.status,
  owner: { name: data.ownerName ?? '' },
  recycler: data.recyclerName
    ? { name: data.recyclerName }
    : undefined,
});

export const listMyRecyclingRequests = async (
  userId: string,
): Promise<RecyclingRequest[]> =>
  fsCall(async () => {
    requireUser(userId);

    const [owned, assigned] = await Promise.all([
      getDocs(
        query(recyclingRef, where('ownerId', '==', userId)),
      ),
      getDocs(
        query(recyclingRef, where('recyclerId', '==', userId)),
      ),
    ]);

    const unique = new Map<string, RecyclingRequest>();

    [...owned.docs, ...assigned.docs].forEach((d) => {
      unique.set(d.id, mapRecyclingRequest(d.id, d.data()));
    });

    return [...unique.values()].sort((a, b) =>
      b.id.localeCompare(a.id),
    );
  });

export const createRecyclingRequest = async (
  user: Member5User,
  payload: {
    itemId?: string;
    itemName: string;
    category: string;
    quantity: number;
    pickupAddress: string;
    notes?: string;
  },
): Promise<void> =>
  fsCall(async () => {
    requireUser(user.id);

    await addDoc(recyclingRef, {
      itemId: payload.itemId || null,
      itemName: payload.itemName,
      categoryName: payload.category,
      quantity: payload.quantity,
      ownerId: user.id,
      ownerName: user.name,
      recyclerId: null,
      recyclerName: null,
      pickupAddress: payload.pickupAddress,
      notes: payload.notes ?? '',
      status: 'REQUESTED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  });

export const updateRecyclingRequest = async (
  requestId: string,
  user: Member5User,
  status: 'ACCEPTED' | 'COLLECTED' | 'COMPLETED',
): Promise<void> =>
  fsCall(async () => {
    requireUser(user.id);

    if (user.role !== 'RECYCLER') {
      throw new Error('Only recyclers can update pickup requests.');
    }

    const requestRef = doc(db, 'recyclingRequests', requestId);
    const transactionRef = doc(transactionsRef);
    let ownerId = '';
    let itemName = '';
    let category = '';

    await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(requestRef);

      if (!snapshot.exists()) {
        throw new Error('Recycling request not found.');
      }

      const request = snapshot.data();

      if (status === 'ACCEPTED') {
        if (request.status !== 'REQUESTED') {
          throw new Error('This request is no longer available.');
        }
      } else {
        if (
          request.recyclerId !== user.id ||
          (status === 'COLLECTED' && request.status !== 'ACCEPTED') ||
          (status === 'COMPLETED' && request.status !== 'COLLECTED')
        ) {
          throw new Error('Invalid recycling request status.');
        }
      }

      ownerId = request.ownerId;
      itemName = request.itemName;
      category = request.categoryName ?? '';

      tx.update(requestRef, {
        status,
        ...(status === 'ACCEPTED'
          ? { recyclerId: user.id, recyclerName: user.name }
          : {}),
        updatedAt: nowIso(),
      });

      if (status === 'COMPLETED') {
        tx.set(transactionRef, {
          kind: 'RECYCLING',
          refId: requestId,
          fromUserId: ownerId,
          toUserId: user.id,
          itemName,
          completedAt: nowIso(),
        });
      }
    });

    if (status === 'ACCEPTED') {
      await notify(
        ownerId,
        'Recycling request accepted',
        `${user.name} accepted your pickup request.`,
        { type: 'RECYCLING', refId: requestId },
      );
    }

    if (status === 'COMPLETED') {
      await awardEcoPoints(ownerId, 'RECYCLE', requestId, category);

      await notify(
        ownerId,
        'Recycling completed',
        `Your recycling request for ${itemName} has been completed.`,
        { type: 'RECYCLING', refId: requestId },
      );
    }
  });

export const listMyTransactions = async (
  userId: string,
): Promise<Transaction[]> =>
  fsCall(async () => {
    requireUser(userId);

    const [sent, received] = await Promise.all([
      getDocs(
        query(transactionsRef, where('fromUserId', '==', userId)),
      ),
      getDocs(
        query(transactionsRef, where('toUserId', '==', userId)),
      ),
    ]);

    const unique = new Map<string, Transaction>();

    [...sent.docs, ...received.docs].forEach((d) => {
      const data = d.data();

      unique.set(d.id, {
        id: d.id,
        kind: data.kind,
        refId: data.refId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        completedAt: data.completedAt ?? '',
        fromUser: { name: data.fromUserId ?? '' },
        toUser: { name: data.toUserId ?? '' },
        listing: data.kind === 'LISTING'
          ? { title: data.listingTitle ?? '' }
          : undefined,
        recyclingRequest: data.kind === 'RECYCLING'
          ? { itemName: data.itemName ?? '' }
          : undefined,
      });
    });

    return [...unique.values()].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    );
  });


// Temporary direct Firestore integration pending Member 2's migration.
export const listMyItems = async (userId: string) =>
  fsCall(async () => {
    requireUser(userId);

    const snapshot = await getDocs(
      query(collection(db, 'items'), where('ownerId', '==', userId)),
    );

    return snapshot.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        name: data.name ?? '',
        condition: data.condition ?? '',
        action: data.action ?? '',
        category: {
          id: data.categoryId ?? '',
          name: data.categoryName ?? '',
        },
      };
    });
  });






