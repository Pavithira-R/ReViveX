export type EcoActionType = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';

export type EcoBadge = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

/** Estimated environmental impact (typical values per device type, not measurements). */
export interface EcoImpact {
  co2SavedKg: number;
  ewasteDivertedKg: number;
  drivingKmEquivalent: number;
}

/** Response of GET /api/eco/community. */
export interface CommunityImpact extends EcoImpact {
  devicesCount: number;
  contributors: number;
}

export interface EcoAction {
  id: string;
  type: EcoActionType;
  points: number;
  refId: string;
  deviceCategory: string;
  co2SavedKg: number;
  createdAt: string;
}

/** Response of GET /api/eco/me. */
export interface EcoSummary {
  totalPoints: number;
  badge: EcoBadge;
  nextBadge: { badge: EcoBadge; pointsNeeded: number } | null;
  counts: Record<EcoActionType, number>;
  impact: EcoImpact;
  recent: EcoAction[];
}
