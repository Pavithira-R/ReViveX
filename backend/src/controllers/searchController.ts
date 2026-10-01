// ============================================================================
// Member 3 - Search Controller
// Handles HTTP request validation and delegates to SearchService
// ============================================================================

import { Request, Response } from 'express';
import { searchService } from '../services/searchService';
import { validateSearchQuery } from '../validators/searchValidator';

export class SearchController {
  /**
   * GET /api/search
   * Unified cross-domain search endpoint aggregating items, providers, and listings
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateSearchQuery(req.query as Record<string, unknown>);

      if (!validation.isValid || !validation.validatedQuery) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      const searchData = await searchService.search(validation.validatedQuery);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Search results retrieved successfully',
        data: searchData,
      });
    } catch (error: any) {
      console.error('Unhandled search controller error:', error);
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Internal server error during search execution',
      });
    }
  }
}

export const searchController = new SearchController();
