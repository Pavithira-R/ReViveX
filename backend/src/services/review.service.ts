import { CreateReviewDto, ReviewResponseData, ProviderReviewsSummary } from '../types/review.types';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  // Graceful fallback to mock store if database client cannot initialize
  prisma = null;
}

// In-Memory store for isolated local testing / development without live database
const mockReviews: ReviewResponseData[] = [];

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(dto: CreateReviewDto, reviewerId: string): Promise<ReviewResponseData> {
    const newReview: ReviewResponseData = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rating: Number(dto.rating),
      comment: dto.comment?.trim() ? dto.comment.trim() : null,
      reviewerId,
      providerId: dto.providerId || dto.targetUserId || null,
      repairRequestId: dto.repairRequestId || null,
      itemId: dto.itemId || null,
      createdAt: new Date().toISOString(),
    };

    // Attempt Prisma persistence if connected, else fallback to mock store
    if (prisma) {
      try {
        const created = await prisma.review.create({
          data: {
            rating: newReview.rating,
            comment: newReview.comment,
            reviewerId: newReview.reviewerId,
            providerId: newReview.providerId,
            repairRequestId: newReview.repairRequestId,
            itemId: newReview.itemId,
          },
        });
        return {
          id: created.id,
          rating: created.rating,
          comment: created.comment,
          reviewerId: created.reviewerId,
          providerId: created.providerId,
          repairRequestId: created.repairRequestId,
          itemId: created.itemId,
          createdAt: created.createdAt.toISOString(),
        };
      } catch (err: any) {
        // If table doesn't exist yet or DB is offline during local Phase 1 dev, save in mock store
        console.warn('Prisma query failed, falling back to mock store for Phase 1 local testing:', err?.message || err);
      }
    }

    mockReviews.unshift(newReview);
    return newReview;
  }

  /**
   * Get all reviews for a specific provider with rating summary
   */
  async getProviderReviews(providerId: string): Promise<ProviderReviewsSummary> {
    let reviews: ReviewResponseData[] = [];

    if (prisma) {
      try {
        const dbReviews = await prisma.review.findMany({
          where: { providerId },
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: { name: true },
            },
          },
        });

        reviews = dbReviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer?.name || 'Anonymous User',
          providerId: r.providerId,
          repairRequestId: r.repairRequestId,
          itemId: r.itemId,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (err: any) {
        reviews = mockReviews.filter((r) => r.providerId === providerId);
      }
    } else {
      reviews = mockReviews.filter((r) => r.providerId === providerId);
    }

    // Compute rating breakdown and average
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;

    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        breakdown[r.rating as 1 | 2 | 3 | 4 | 5]++;
        totalScore += r.rating;
      }
    }

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? parseFloat((totalScore / totalReviews).toFixed(1)) : 0;

    return {
      providerId,
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
      reviews,
    };
  }

  /**
   * Helper to clear mock store (useful for clean unit tests)
   */
  clearMockStore(): void {
    mockReviews.length = 0;
  }

  /**
   * Helper to seed mock store for testing
   */
  seedMockStore(seed: ReviewResponseData[]): void {
    mockReviews.push(...seed);
  }
}

export const reviewService = new ReviewService();
