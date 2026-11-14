import { Request, Response, NextFunction } from 'express';
import { ecoService } from '../services';
import { sendSuccess } from '../utils';

export class EcoController {
  /**
   * GET /api/eco/me
   */
  async getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await ecoService.getSummary(req.user!.id);
      sendSuccess(res, 'Eco impact retrieved', summary);
    } catch (error) {
      next(error);
    }
  }
}

export const ecoController = new EcoController();
