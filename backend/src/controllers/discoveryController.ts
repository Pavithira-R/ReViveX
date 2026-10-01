// ============================================================================
// Member 3 - Discovery Feed Controller
// HTTP Controller for GET /api/discovery/feed
// ============================================================================

import { Request, Response } from 'express';
import { validateDiscoveryQuery } from '../validators/discoveryValidator';
import { discoveryService } from '../services/discoveryService';

export class DiscoveryController {
  /**
   * GET /api/discovery/feed
   * Retrieves curated discovery sections across providers, marketplace, recycling, and items.
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateDiscoveryQuery(req.query);

      if (!validation.isValid || !validation.validatedQuery) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      const feedData = await discoveryService.getFeed(validation.validatedQuery);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Discovery feed retrieved successfully',
        data: feedData,
      });
    } catch (error: any) {
      console.error('Unhandled error in DiscoveryController:', error);
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: 'Internal server error processing discovery feed',
      });
    }
  }
}

export const discoveryController = new DiscoveryController();
