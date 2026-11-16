// Member 6 – Ratings and reviews (Firestore `reviews` collection)
import { collection, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso } from './firebaseHelpers';
import { notify } from './notification.service';
import { CreateReviewData, Review, ReviewRefType, ReviewSummary } from '../types';

export const REVIEW_COMMENT_MAX = 500;
const REF_TYPES: ReviewRefType[] = ['REPAIR', 'LISTING', 'RECYCLING'];

const validation = (details: string[]) => new ApiError('Validation failed', 400, 'VALIDATION_ERROR', details);

/** One review per person per completed activity: `TYPE_refId_reviewerId`. */
export const reviewId = (refType: ReviewRefType, refId: string, reviewerId: string) =>
  `${refType}_${refId}_${reviewerId}`;

const validate = (data: CreateReviewData, reviewerId: string) => {
  const errors: string[] = [];
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.push('Please choose a rating from 1 to 5 stars');
  }
  if ((data.comment ?? '').trim().length > REVIEW_COMMENT_MAX) {
    errors.push(`Comment must be at most ${REVIEW_COMMENT_MAX} characters`);
  }
  if (!REF_TYPES.includes(data.refType) || !data.refId) errors.push('What is being reviewed is missing');
  if (!data.revieweeId) errors.push('Who is being reviewed is missing');
  else if (data.revieweeId === reviewerId) errors.push('You cannot review yourself');
  if (errors.length) throw validation(errors);
};

export const reviewService = {
  /**
   * Leave a review after a completed repair, listing or recycling pickup, e.g.
   *   await reviewService.create({ revieweeId: request.providerId, refType: 'REPAIR', refId: request.id, rating: 5 });
   * The reviewed person gets a notification.
   */
  create: (data: CreateReviewData): Promise<Review> =>
    fsCall(async () => {
      const reviewerId = auth.currentUser?.uid;
      if (!reviewerId) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
      validate(data, reviewerId);

      const reviewer = (await getDoc(doc(db, 'users', reviewerId))).data() ?? {};
      const comment = data.comment?.trim() || null;
      const review: Omit<Review, 'id'> = {
        reviewerId,
        reviewerName: String(reviewer.name ?? 'ReViveX user'),
        revieweeId: data.revieweeId,
        refType: data.refType,
        refId: data.refId,
        rating: data.rating,
        comment,
        createdAt: nowIso(),
      };
      const id = reviewId(data.refType, data.refId, reviewerId);
      const ref = doc(db, 'reviews', id);

      await runTransaction(db, async (tx) => {
        if ((await tx.get(ref)).exists()) {
          throw new ApiError('You have already reviewed this', 409, 'ALREADY_REVIEWED');
        }
        tx.set(ref, review);
      });

      await notify(
        data.revieweeId,
        'New review',
        `${review.reviewerName} gave you ${data.rating} star${data.rating === 1 ? '' : 's'}.`,
        { type: 'REVIEW', refId: id }
      );
      return { id, ...review };
    }),

  /** Whether the signed-in user already reviewed this activity (hide the "Leave a review" button). */
  hasReviewed: (refType: ReviewRefType, refId: string): Promise<boolean> =>
    fsCall(async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      return (await getDoc(doc(db, 'reviews', reviewId(refType, refId, uid)))).exists();
    }),

  /** Reviews a user has received, newest first, with the average and star breakdown. */
  listFor: (userId: string): Promise<ReviewSummary> =>
    fsCall(async () => {
      const snapshot = await getDocs(query(collection(db, 'reviews'), where('revieweeId', '==', userId)));
      const reviews = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const breakdown: ReviewSummary['breakdown'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r) => (breakdown[r.rating as 1 | 2 | 3 | 4 | 5] += 1));
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      return {
        averageRating: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
        totalReviews: reviews.length,
        breakdown,
        reviews,
      };
    }),
};
