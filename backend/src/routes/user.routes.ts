import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate } from '../middleware';
import { getMyItems } from './item.routes';

const router = Router();

router.use(authenticate);

// `/me` must be registered before `/:id`
router.get('/me', (req, res, next) => userController.getMe(req, res, next));
router.put('/me', (req, res, next) => userController.updateMe(req, res, next));
router.get('/me/items', (req, res, next) => {
	void getMyItems(req, res).catch(next);
});
router.get('/:id', (req, res, next) => userController.getById(req, res, next));

export default router;
