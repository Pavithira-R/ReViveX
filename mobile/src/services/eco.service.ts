// Member 6 – Eco impact
import { doc, runTransaction } from 'firebase/firestore';
import { ApiError, apiRequest } from './api';
import { db } from './firebase';
import { fsCall, nowIso } from './firebaseHelpers';
import { notify } from './notification.service';
import { CommunityImpact, EcoActionType, EcoSummary } from '../types';
import { ACTION_PHRASES, ECO_ACTION_TYPES, ECO_POINTS, impactFor, normalizeDeviceCategory } from '../utils/eco';

export interface EcoAwardResult {
  awarded: boolean;
  points: number;
}

/**
 * Record a completed sustainable activity and award its points. Used by other modules
 * when something becomes Completed, e.g.
 *   await awardEcoPoints(request.customerId, 'REPAIR', request.id, request.categoryName);
 * The device category is optional (unknown → OTHER) and only affects the impact estimate.
 * Calling it again for the same activity does nothing: the document id `TYPE_refId`
 * allows one award per activity.
 */
export const awardEcoPoints = async (
  userId: string,
  type: EcoActionType,
  refId: string,
  category?: string | null
): Promise<EcoAwardResult> => {
  if (!ECO_ACTION_TYPES.includes(type)) {
    throw new ApiError(`Unknown eco action type: ${type}`, 400, 'VALIDATION_ERROR');
  }
  const points = ECO_POINTS[type];
  const deviceCategory = normalizeDeviceCategory(category);
  const { co2SavedKg, ewasteKg } = impactFor(type, deviceCategory);
  const ref = doc(db, 'ecoActions', `${type}_${refId}`);

  const awarded = await fsCall(() =>
    runTransaction(db, async (tx) => {
      if ((await tx.get(ref)).exists()) return false;
      tx.set(ref, { userId, type, points, refId, deviceCategory, co2SavedKg, ewasteKg, createdAt: nowIso() });
      return true;
    })
  );
  if (awarded) {
    await notify(
      userId,
      'Eco points earned',
      `+${points} points for ${ACTION_PHRASES[type]}. About ${co2SavedKg} kg CO2 saved.`,
      { type: 'ECO', refId }
    );
  }
  return { awarded, points: awarded ? points : 0 };
};

// The summary screens move to Firestore in Phase 2.
export const ecoService = {
  getMine: () => apiRequest<EcoSummary>('GET', '/eco/me'),

  getCommunity: () => apiRequest<CommunityImpact>('GET', '/eco/community'),
};
