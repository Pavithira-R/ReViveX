// Member 6 – Eco impact rules (same numbers the backend used, so reports stay consistent)
import { EcoActionType, EcoBadge, EcoImpact, EcoSummary } from '../types';

export const ECO_ACTION_TYPES: EcoActionType[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

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

/** Points earned per completed activity. Donating and recycling earn most. */
export const ECO_POINTS: Record<EcoActionType, number> = {
  REPAIR: 20,
  REUSE: 15,
  SELL: 10,
  DONATE: 25,
  RECYCLE: 30,
};

/** Wording used in the "points earned" notification. */
export const ACTION_PHRASES: Record<EcoActionType, string> = {
  REPAIR: 'repairing a device',
  REUSE: 'giving a device a second use',
  SELL: 'selling a used device',
  DONATE: 'donating a device',
  RECYCLE: 'recycling a device',
};

/**
 * Typical values per device type, used for *estimates* only:
 * - manufacturingCo2Kg: approximate CO2 emitted to make a new device of this type
 * - weightKg:           approximate weight of the device
 */
export const DEVICE_PROFILES: Record<EcoDeviceCategory, { manufacturingCo2Kg: number; weightKg: number }> = {
  PHONE: { manufacturingCo2Kg: 60, weightKg: 0.2 },
  LAPTOP: { manufacturingCo2Kg: 300, weightKg: 2.0 },
  TABLET: { manufacturingCo2Kg: 100, weightKg: 0.5 },
  DESKTOP: { manufacturingCo2Kg: 350, weightKg: 8.0 },
  MONITOR: { manufacturingCo2Kg: 350, weightKg: 5.0 },
  PRINTER: { manufacturingCo2Kg: 150, weightKg: 6.0 },
  HEADPHONES: { manufacturingCo2Kg: 10, weightKg: 0.3 },
  KEYBOARD: { manufacturingCo2Kg: 15, weightKg: 0.8 },
  CAMERA: { manufacturingCo2Kg: 50, weightKg: 0.6 },
  BATTERY_CHARGER: { manufacturingCo2Kg: 3, weightKg: 0.2 },
  OTHER: { manufacturingCo2Kg: 50, weightKg: 1.0 },
};

/**
 * Share of a new device's manufacturing CO2 that the activity avoids.
 * Repairing or passing a device on means one less new device is made.
 * Recycling only recovers materials.
 */
export const CO2_AVOIDED_SHARE: Record<EcoActionType, number> = {
  REPAIR: 0.8,
  REUSE: 0.8,
  SELL: 0.8,
  DONATE: 0.8,
  RECYCLE: 0.15,
};

/** Average petrol car, kg CO2 per km, for the "km not driven" comparison. */
export const CAR_CO2_KG_PER_KM = 0.17;

/** Minimum total points for each badge, lowest first. */
export const ECO_BADGES: { badge: EcoBadge; minPoints: number }[] = [
  { badge: 'BRONZE', minPoints: 50 },
  { badge: 'SILVER', minPoints: 150 },
  { badge: 'GOLD', minPoints: 300 },
];

export const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Accepts e.g. "laptop" or "Battery charger"; anything unknown counts as OTHER. */
export const normalizeDeviceCategory = (category?: string | null): EcoDeviceCategory => {
  const key = (category ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return key in DEVICE_PROFILES ? (key as EcoDeviceCategory) : 'OTHER';
};

/** Estimated CO2 avoided and e-waste kept out of landfill for one activity. */
export const impactFor = (type: EcoActionType, category: EcoDeviceCategory) => {
  const profile = DEVICE_PROFILES[category];
  return {
    co2SavedKg: round1(profile.manufacturingCo2Kg * CO2_AVOIDED_SHARE[type]),
    ewasteKg: profile.weightKg,
  };
};

export const toImpact = (co2SavedKg: number, ewasteKg: number): EcoImpact => ({
  co2SavedKg: round1(co2SavedKg),
  ewasteDivertedKg: round1(ewasteKg),
  drivingKmEquivalent: Math.round(co2SavedKg / CAR_CO2_KG_PER_KM),
});

export const badgeFor = (totalPoints: number): EcoBadge => {
  let badge: EcoBadge = 'NONE';
  for (const level of ECO_BADGES) {
    if (totalPoints >= level.minPoints) badge = level.badge;
  }
  return badge;
};

export const nextBadgeFor = (totalPoints: number): EcoSummary['nextBadge'] => {
  const next = ECO_BADGES.find((level) => totalPoints < level.minPoints);
  return next ? { badge: next.badge, pointsNeeded: next.minPoints - totalPoints } : null;
};
