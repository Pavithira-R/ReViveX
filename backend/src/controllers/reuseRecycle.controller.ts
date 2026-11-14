import { Request, Response, NextFunction } from 'express';
import { reuseRecycleService } from '../services/reuseRecycle.service';
import { sendSuccess } from '../utils/apiResponse';

class ReuseRecycleController {
  async listListings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.listListings(
        req.query.type as string | undefined,
      );

      return sendSuccess(res, 'Listings retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async getListing(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.getListing(req.params.id);

      return sendSuccess(res, 'Listing retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async createListing(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.createListing(
        req.user!.id,
        req.body,
      );

      return sendSuccess(res, 'Listing created successfully.', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.createOffer(
        req.user!.id,
        req.params.id,
        req.body,
      );

      return sendSuccess(res, 'Offer submitted successfully.', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.getOffersForListing(
        req.user!.id,
        req.params.id,
      );

      return sendSuccess(res, 'Offers retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.respondToOffer(
        req.user!.id,
        req.params.id,
        req.body.status,
      );

      return sendSuccess(res, 'Offer response saved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async createRecyclingRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await reuseRecycleService.createRecyclingRequest(
        req.user!.id,
        req.body,
      );

      return sendSuccess(
        res,
        'Recycling request submitted successfully.',
        result,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async myRecyclingRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await reuseRecycleService.getMyRecyclingRequests(
        req.user!.id,
        req.user!.role,
      );

      return sendSuccess(
        res,
        'Recycling requests retrieved successfully.',
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateRecyclingStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await reuseRecycleService.updateRecyclingStatus(
        req.user!.id,
        req.params.id,
        req.body.status,
      );

      return sendSuccess(
        res,
        'Recycling request status updated successfully.',
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async myTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reuseRecycleService.getMyTransactions(
        req.user!.id,
      );

      return sendSuccess(
        res,
        'Transactions retrieved successfully.',
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const reuseRecycleController = new ReuseRecycleController();