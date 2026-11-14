import { Router } from 'express';
import { authenticate, requireRole } from '../middleware';
import { reuseRecycleController } from '../controllers/reuseRecycle.controller';

const router = Router();

router.use(authenticate);

// Reuse, selling and donation listings
router.get('/listings', (req, res, next) =>
  reuseRecycleController.listListings(req, res, next),
);

router.post('/listings', (req, res, next) =>
  reuseRecycleController.createListing(req, res, next),
);

router.get('/listings/:id', (req, res, next) =>
  reuseRecycleController.getListing(req, res, next),
);

// Offers
router.post('/listings/:id/offers', (req, res, next) =>
  reuseRecycleController.createOffer(req, res, next),
);

router.get('/listings/:id/offers', (req, res, next) =>
  reuseRecycleController.getOffers(req, res, next),
);

router.patch('/offers/:id', (req, res, next) =>
  reuseRecycleController.respondToOffer(req, res, next),
);

// Recycling requests
router.post('/recycling-requests', (req, res, next) =>
  reuseRecycleController.createRecyclingRequest(req, res, next),
);

router.get('/recycling-requests/mine', (req, res, next) =>
  reuseRecycleController.myRecyclingRequests(req, res, next),
);

router.patch(
  '/recycling-requests/:id/status',
  requireRole('RECYCLER'),
  (req, res, next) =>
    reuseRecycleController.updateRecyclingStatus(req, res, next),
);

// Transactions
router.get('/transactions/mine', (req, res, next) =>
  reuseRecycleController.myTransactions(req, res, next),
);

export default router;