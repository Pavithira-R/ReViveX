// ============================================================================
// Member 4 - Service Provider Controller (Phase 1)
// ============================================================================

import { Request, Response } from 'express';
import { providerService } from '../services/providerService';
import { validateProviderId, validateProviderQuery } from '../validators/providerValidator';

export class ProviderController {
  async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;

      const validation = validateProviderQuery({ search, category });
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const providers = await providerService.getAllProviders({ search, category });
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: providers,
        message: 'Providers retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Internal server error while fetching providers',
      });
    }
  }

  async getProviderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validation = validateProviderId(id);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const provider = await providerService.getProviderById(id);
      if (!provider) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          error: `Service provider with ID '${id}' was not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: provider,
        message: 'Provider details retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Internal server error while fetching provider details',
      });
    }
  }
}

export const providerController = new ProviderController();
