// Member 6 – Eco impact
import {
  collection,
  doc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  where,
} from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso } from './firebaseHelpers';
import { notify } from './notification.service';
import { CommunityImpact, EcoAction, EcoActionType, EcoSummary } from '../types';
import {
  ACTION_PHRASES,
  badgeFor,
  ECO_ACTION_TYPES,
  ECO_POINTS,
  impactFor,
  nextBadgeFor,
  normalizeDeviceCategory,
  toImpact,
} from '../utils/eco';

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

type StoredEcoAction = EcoAction & { userId: string; ewasteKg: number };

const RECENT_LIMIT = 10;
const ecoActions = collection(db, 'ecoActions');

const toAction = (d: QueryDocumentSnapshot): StoredEcoAction => ({ id: d.id, ...(d.data() as Omit<StoredEcoAction, 'id'>) });

export const ecoService = {
  /** Eco impact of the signed-in user: points, badge, counts, estimated impact and recent activity. */
  getMine: (): Promise<EcoSummary> =>
    fsCall(async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
      const actions = (await getDocs(query(ecoActions, where('userId', '==', uid)))).docs
        .map(toAction)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const counts = Object.fromEntries(ECO_ACTION_TYPES.map((t) => [t, 0])) as EcoSummary['counts'];
      let totalPoints = 0;
      let co2SavedKg = 0;
      let ewasteKg = 0;
      for (const action of actions) {
        counts[action.type] += 1;
        totalPoints += action.points;
        co2SavedKg += action.co2SavedKg;
        ewasteKg += action.ewasteKg;
      }

      return {
        totalPoints,
        badge: badgeFor(totalPoints),
        nextBadge: nextBadgeFor(totalPoints),
        counts,
        impact: toImpact(co2SavedKg, ewasteKg),
        recent: actions.slice(0, RECENT_LIMIT).map(({ userId: _u, ewasteKg: _e, ...action }) => action),
      };
    }),

  /** Totals for all ReViveX users, shown as "community impact". */
  getCommunity: (): Promise<CommunityImpact> =>
    fsCall(async () => {
      const actions = (await getDocs(ecoActions)).docs.map(toAction);
      const co2SavedKg = actions.reduce((sum, a) => sum + a.co2SavedKg, 0);
      const ewasteKg = actions.reduce((sum, a) => sum + a.ewasteKg, 0);
      return {
        ...toImpact(co2SavedKg, ewasteKg),
        devicesCount: actions.length,
        contributors: new Set(actions.map((a) => a.userId)).size,
      };
    }),
};
