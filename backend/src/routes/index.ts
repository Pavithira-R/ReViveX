import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import ecoRoutes from './eco.routes';
import notificationRoutes from './notification.routes';
import chatRoutes from './chat.routes';
import reportRoutes from './report.routes';
import discoveryRoutes from './discoveryRoutes';
import recommendationRoutes from './recommendationRoutes';
import searchRoutes from './searchRoutes';
import itemRoutes from './item.routes';
import categoryRoutes from './category.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/eco', ecoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/conversations', chatRoutes);
router.use('/reports', reportRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/search', searchRoutes);
router.use('/items', itemRoutes);
router.use('/categories', categoryRoutes);

export default router;
