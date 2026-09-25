export interface CreateReviewDto {
  rating: number;
  comment?: string;
  providerId?: string;
  targetUserId?: string;
  repairRequestId?: string;
  itemId?: string;
  reviewerId?: string; // Provided by auth middleware or mock testing
}

export interface ReviewResponseData {
  id: string;
  rating: number;
  comment: string | null;
  reviewerId: string;
  reviewerName?: string;
  providerId: string | null;
  repairRequestId?: string | null;
  itemId?: string | null;
  createdAt: string | Date;
}

export interface ProviderReviewsSummary {
  providerId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviews: ReviewResponseData[];
}
