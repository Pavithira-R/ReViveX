// ============================================================================
// Member 3 - Integration Adapters Setup
// Connects integration adapters (ItemAdapter, etc.) to live Prisma ORM models
// ============================================================================

import prisma from '../utils/prisma';
import { ItemAdapter } from './itemAdapter';

export function setupAdapters(): void {
  try {
    // Connect ItemAdapter to live Prisma Item & Category models (Member 2)
    ItemAdapter.setDelegates(
      async () => {
        return await prisma.item.findMany({
          include: {
            category: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      },
      async (id: string) => {
        return await prisma.item.findUnique({
          where: { id },
          include: {
            category: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
    );

    console.log('[Member 3 Adapters] Live Prisma ItemAdapter delegate connected.');
  } catch (error: any) {
    console.error('[Member 3 Adapters] Error setting up adapter delegates:', error.message);
  }
}
