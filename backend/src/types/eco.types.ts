export type EcoActionType = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';

export const ECO_ACTION_TYPES: EcoActionType[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

export type EcoBadge = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface EcoActionView {
  id: string;
  type: EcoActionType;
  points: number;
  refId: string;
  createdAt: Date | string;
}

/** Response of GET /api/eco/me. */
export interface EcoSummary {
  totalPoints: number;
  badge: EcoBadge;
  /** Next badge to earn, or null at the top badge. */
  nextBadge: { badge: EcoBadge; pointsNeeded: number } | null;
  /** Completed activities per type, e.g. { REPAIR: 2, RECYCLE: 1, ... }. */
  counts: Record<EcoActionType, number>;
  /** Most recent activities first. */
  recent: EcoActionView[];
}

/** Result of awardEcoPoints(). `awarded` is false when that activity already earned points. */
export interface EcoAwardResult {
  awarded: boolean;
  points: number;
}
