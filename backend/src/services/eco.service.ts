// Member 6 – Eco impact
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils';
import { notify } from './notification.service';
import {
  CommunityImpact,
  EcoDeviceCategory,
  ECO_ACTION_TYPES,
  EcoActionType,
  EcoAwardResult,
  EcoBadge,
  EcoImpact,
  EcoSummary,
} from '../types';

/** Points earned per completed activity. Donating and recycling earn most. */
export const ECO_POINTS: Record<EcoActionType, number> = {
  REPAIR: 20,
  REUSE: 15,
  SELL: 10,
  DONATE: 25,
  RECYCLE: 30,
};

/** Wording used in the "points earned" notification. */
const ACTION_PHRASES: Record<EcoActionType, string> = {
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
 * Repairing or passing a device on means one less new device is made (the rest
 * covers repair parts and transport). Recycling only recovers materials.
 */
export const CO2_AVOIDED_SHARE: Record<EcoActionType, number> = {
  REPAIR: 0.8,
  REUSE: 0.8,
  SELL: 0.8,
  DONATE: 0.8,
  RECYCLE: 0.15,
};

/** Average petrol car, kg CO2 per km, for the "km not driven" comparison. */
const CAR_CO2_KG_PER_KM = 0.17;

/** Minimum total points for each badge, lowest first. */
export const ECO_BADGES: { badge: EcoBadge; minPoints: number }[] = [
  { badge: 'BRONZE', minPoints: 50 },
  { badge: 'SILVER', minPoints: 150 },
  { badge: 'GOLD', minPoints: 300 },
];

const RECENT_LIMIT = 10;

const round1 = (value: number) => Math.round(value * 10) / 10;

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
    // Repaired, reused and recycled devices all stay out of landfill.
    ewasteKg: profile.weightKg,
  };
};

const toImpact = (co2SavedKg: number, ewasteKg: number): EcoImpact => ({
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

const nextBadgeFor = (totalPoints: number): EcoSummary['nextBadge'] => {
  const next = ECO_BADGES.find((level) => totalPoints < level.minPoints);
  return next ? { badge: next.badge, pointsNeeded: next.minPoints - totalPoints } : null;
};

export class EcoService {
  /**
   * Record a completed sustainable activity and award its points.
   * Called by other modules when something becomes Completed, e.g.
   *   await ecoService.awardEcoPoints(request.ownerId, 'REPAIR', request.id, item.category);
   * The device category is optional (unknown → OTHER) and only affects the impact estimate.
   * Calling it again for the same activity does nothing (no double points).
   */
  async awardEcoPoints(
    userId: string,
    type: EcoActionType,
    refId: string,
    deviceCategory?: string | null
  ): Promise<EcoAwardResult> {
    if (!ECO_ACTION_TYPES.includes(type)) {
      throw new AppError(`Unknown eco action type: ${type}`, 400, 'VALIDATION_ERROR');
    }

    const points = ECO_POINTS[type];
    const category = normalizeDeviceCategory(deviceCategory);
    const { co2SavedKg, ewasteKg } = impactFor(type, category);
    try {
      await prisma.ecoAction.create({
        data: { userId, type, points, refId, deviceCategory: category, co2SavedKg, ewasteKg },
      });
      await notify(
        userId,
        'Eco points earned',
        `+${points} points for ${ACTION_PHRASES[type]}. About ${co2SavedKg} kg CO2 saved.`,
        { type: 'ECO', refId }
      );
      return { awarded: true, points };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { awarded: false, points: 0 };
      }
      throw error;
    }
  }

  /** Eco impact of the signed-in user: points, badge, counts, estimated impact and recent activity. */
  async getSummary(userId: string): Promise<EcoSummary> {
    const actions = await prisma.ecoAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const counts = Object.fromEntries(ECO_ACTION_TYPES.map((t) => [t, 0])) as EcoSummary['counts'];
    let totalPoints = 0;
    let co2SavedKg = 0;
    let ewasteKg = 0;
    for (const action of actions) {
      if (action.type in counts) {
        counts[action.type as EcoActionType] += 1;
      }
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
      recent: actions.slice(0, RECENT_LIMIT).map((action) => ({
        id: action.id,
        type: action.type as EcoActionType,
        points: action.points,
        refId: action.refId,
        deviceCategory: action.deviceCategory,
        co2SavedKg: action.co2SavedKg,
        createdAt: action.createdAt,
      })),
    };
  }

  /** Totals for all ReViveX users, shown as "community impact". */
  async getCommunityImpact(): Promise<CommunityImpact> {
    const [totals, contributors] = await Promise.all([
      prisma.ecoAction.aggregate({
        _sum: { co2SavedKg: true, ewasteKg: true },
        _count: { _all: true },
      }),
      prisma.ecoAction.groupBy({ by: ['userId'] }),
    ]);

    return {
      ...toImpact(totals._sum.co2SavedKg ?? 0, totals._sum.ewasteKg ?? 0),
      devicesCount: totals._count._all,
      contributors: contributors.length,
    };
  }
}

export const ecoService = new EcoService();

/** Shortcut for other modules: `import { awardEcoPoints } from '../services';` */
export const awardEcoPoints = (
  userId: string,
  type: EcoActionType,
  refId: string,
  deviceCategory?: string | null
) => ecoService.awardEcoPoints(userId, type, refId, deviceCategory);
