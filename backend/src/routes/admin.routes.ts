import { Router } from 'express';
import { reportController, userController } from '../controllers';
import { authenticate, requireRole } from '../middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/users', (req, res, next) => userController.adminList(req, res, next));
router.get('/users/:id', (req, res, next) => userController.adminGet(req, res, next));
router.patch('/users/:id/role', (req, res, next) => userController.adminChangeRole(req, res, next));
router.patch('/users/:id/status', (req, res, next) => userController.adminSetStatus(req, res, next));

// Problem reports sent from the app
router.get('/reports', (req, res, next) => reportController.adminList(req, res, next));
router.patch('/reports/:id/resolve', (req, res, next) => reportController.adminResolve(req, res, next));

export default router;
