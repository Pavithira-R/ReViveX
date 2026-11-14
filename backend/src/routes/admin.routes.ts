import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, requireRole } from '../middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/users', (req, res, next) => userController.adminList(req, res, next));
router.get('/users/:id', (req, res, next) => userController.adminGet(req, res, next));
router.patch('/users/:id/role', (req, res, next) => userController.adminChangeRole(req, res, next));
router.patch('/users/:id/status', (req, res, next) => userController.adminSetStatus(req, res, next));

export default router;
