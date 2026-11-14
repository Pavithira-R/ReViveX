export type EcoActionType = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';

export type EcoBadge = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface EcoAction {
  id: string;
  type: EcoActionType;
  points: number;
  refId: string;
  createdAt: string;
}

/** Response of GET /api/eco/me. */
export interface EcoSummary {
  totalPoints: number;
  badge: EcoBadge;
  nextBadge: { badge: EcoBadge; pointsNeeded: number } | null;
  counts: Record<EcoActionType, number>;
  recent: EcoAction[];
}
