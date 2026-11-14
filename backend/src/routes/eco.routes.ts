import { Router } from 'express';
import { ecoController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

router.get('/me', authenticate, (req, res, next) => ecoController.getMine(req, res, next));

export default router;
