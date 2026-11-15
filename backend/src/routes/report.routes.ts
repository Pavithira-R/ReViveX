// Member 1 – Problem reports (any signed-in user can send one)
import { Router } from 'express';
import { reportController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

router.post('/', authenticate, (req, res, next) => reportController.create(req, res, next));

export default router;
