// Member 6 – Ratings and reviews

/** What was reviewed: a completed repair, a reuse/sell/donate listing, or a recycling pickup. */
export type ReviewRefType = 'REPAIR' | 'LISTING' | 'RECYCLING';

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  refType: ReviewRefType;
  refId: string;
  /** Whole stars, 1–5. */
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateReviewData {
  revieweeId: string;
  refType: ReviewRefType;
  refId: string;
  rating: number;
  comment?: string;
}

/** Everything shown on a user's reviews screen. */
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: Review[];
}
