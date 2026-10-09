import { Router } from 'express';
import { authController, userController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// Public
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Protected
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

// Alias of GET /api/users/me (kept for earlier clients)
router.get('/me', authenticate, (req, res, next) => userController.getMe(req, res, next));

export default router;
