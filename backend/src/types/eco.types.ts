export type EcoActionType = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';

export const ECO_ACTION_TYPES: EcoActionType[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

export type EcoBadge = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export type EcoDeviceCategory =
  | 'PHONE'
  | 'LAPTOP'
  | 'TABLET'
  | 'DESKTOP'
  | 'MONITOR'
  | 'PRINTER'
  | 'HEADPHONES'
  | 'KEYBOARD'
  | 'CAMERA'
  | 'BATTERY_CHARGER'
  | 'OTHER';

/** Estimated environmental impact. Typical values per device type, not measurements. */
export interface EcoImpact {
  co2SavedKg: number;
  ewasteDivertedKg: number;
  /** The same CO2 expressed as kilometres not driven in an average petrol car. */
  drivingKmEquivalent: number;
}

/** Response of GET /api/eco/community: totals for all ReViveX users. */
export interface CommunityImpact extends EcoImpact {
  devicesCount: number;
  contributors: number;
}

export interface EcoActionView {
  id: string;
  type: EcoActionType;
  points: number;
  refId: string;
  deviceCategory: string;
  co2SavedKg: number;
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
  impact: EcoImpact;
  /** Most recent activities first. */
  recent: EcoActionView[];
}

/** Result of awardEcoPoints(). `awarded` is false when that activity already earned points. */
export interface EcoAwardResult {
  awarded: boolean;
  points: number;
}
