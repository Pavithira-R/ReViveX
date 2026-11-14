import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils';
import { notify } from './notification.service';
import {
  ECO_ACTION_TYPES,
  EcoActionType,
  EcoAwardResult,
  EcoBadge,
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

/** Minimum total points for each badge, lowest first. */
export const ECO_BADGES: { badge: EcoBadge; minPoints: number }[] = [
  { badge: 'BRONZE', minPoints: 50 },
  { badge: 'SILVER', minPoints: 150 },
  { badge: 'GOLD', minPoints: 300 },
];

const RECENT_LIMIT = 10;

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
   *   await ecoService.awardEcoPoints(request.ownerId, 'REPAIR', request.id);
   * Calling it again for the same activity does nothing (no double points).
   */
  async awardEcoPoints(
    userId: string,
    type: EcoActionType,
    refId: string
  ): Promise<EcoAwardResult> {
    if (!ECO_ACTION_TYPES.includes(type)) {
      throw new AppError(`Unknown eco action type: ${type}`, 400, 'VALIDATION_ERROR');
    }

    const points = ECO_POINTS[type];
    try {
      await prisma.ecoAction.create({ data: { userId, type, points, refId } });
      await notify(userId, 'Eco points earned', `+${points} points for ${ACTION_PHRASES[type]}.`, {
        type: 'ECO',
        refId,
      });
      return { awarded: true, points };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { awarded: false, points: 0 };
      }
      throw error;
    }
  }

  /** Eco impact of the signed-in user: points, badge, activity counts and recent activity. */
  async getSummary(userId: string): Promise<EcoSummary> {
    const actions = await prisma.ecoAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const counts = Object.fromEntries(ECO_ACTION_TYPES.map((t) => [t, 0])) as EcoSummary['counts'];
    let totalPoints = 0;
    for (const action of actions) {
      counts[action.type] += 1;
      totalPoints += action.points;
    }

    return {
      totalPoints,
      badge: badgeFor(totalPoints),
      nextBadge: nextBadgeFor(totalPoints),
      counts,
      recent: actions.slice(0, RECENT_LIMIT).map(({ id, type, points, refId, createdAt }) => ({
        id,
        type,
        points,
        refId,
        createdAt,
      })),
    };
  }
}

export const ecoService = new EcoService();

/** Shortcut for other modules: `import { awardEcoPoints } from '../services';` */
export const awardEcoPoints = (userId: string, type: EcoActionType, refId: string) =>
  ecoService.awardEcoPoints(userId, type, refId);
