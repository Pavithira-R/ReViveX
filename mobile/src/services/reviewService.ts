import { Review, CreateReviewRequest, ProviderReviewsSummary } from '../types/review';

const API_BASE_URL = 'http://localhost:5000/api';

// Local Mock Fallback Store (ensures full mobile UI testing when backend is not actively running)
const localMockReviews: Review[] = [
  {
    id: 'mock-rev-1',
    rating: 5,
    comment: 'Replaced cracked laptop screen within an hour. Excellent repair quality and friendly service!',
    reviewerId: 'user-001',
    reviewerName: 'Kasun Perera',
    providerId: 'prov-tech-1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'mock-rev-2',
    rating: 4,
    comment: 'Battery replacement for Samsung Galaxy. Working well so far, reasonable pricing.',
    reviewerId: 'user-002',
    reviewerName: 'Dinuka Silva',
    providerId: 'prov-tech-1',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const reviewService = {
  /**
   * Submit a new rating and review
   */
  async submitReview(data: CreateReviewRequest): Promise<Review> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': 'dev-mobile-user-01', // Temporary mock reviewer header for Member 6 phase 1
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message || json?.error?.details?.[0] || 'Failed to submit review');
      }

      return json.data;
    } catch (networkError: any) {
      // In offline/mock mode, simulate local submission
      console.warn('Backend API unavailable, simulating local review submission:', networkError.message);
      
      const newReview: Review = {
        id: `mock-${Date.now()}`,
        rating: data.rating,
        comment: data.comment || null,
        reviewerId: 'dev-mobile-user-01',
        reviewerName: 'Current User (You)',
        providerId: data.providerId || null,
        repairRequestId: data.repairRequestId || null,
        itemId: data.itemId || null,
        createdAt: new Date().toISOString(),
      };
      localMockReviews.unshift(newReview);
      return newReview;
    }
  },

  /**
   * Fetch reviews and rating breakdown for a provider
   */
  async fetchProviderReviews(providerId: string): Promise<ProviderReviewsSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/providers/${providerId}/reviews`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.message || 'Failed to fetch reviews');
      }

      return json.data;
    } catch (networkError: any) {
      console.warn('Backend API unavailable, returning local mock reviews summary:', networkError.message);

      const filtered = localMockReviews.filter((r) => !providerId || r.providerId === providerId);
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;

      for (const r of filtered) {
        if (r.rating >= 1 && r.rating <= 5) {
          breakdown[r.rating as 1 | 2 | 3 | 4 | 5]++;
          sum += r.rating;
        }
      }

      return {
        providerId,
        averageRating: filtered.length > 0 ? parseFloat((sum / filtered.length).toFixed(1)) : 0,
        totalReviews: filtered.length,
        ratingBreakdown: breakdown,
        reviews: filtered,
      };
    }
  },
};
