// Member 1 – Problem reports
import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services';
import { sendSuccess } from '../utils';

export class ReportController {
  /**
   * POST /api/reports   body: { message, screen? }
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportService.create(req.user!.id, req.body);
      sendSuccess(res, 'Thanks! Your report was sent to the team.', report, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/reports?status=OPEN|RESOLVED
   */
  async adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await reportService.list(req.query.status);
      sendSuccess(res, 'Reports retrieved', reports);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/reports/:id/resolve
   */
  async adminResolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportService.resolve(req.params.id);
      sendSuccess(res, 'Report marked as resolved', report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
