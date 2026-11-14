// Member 6 – Chat
import { Router } from 'express';
import { chatController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => chatController.list(req, res, next));
router.post('/', (req, res, next) => chatController.start(req, res, next));
router.get('/:id/messages', (req, res, next) => chatController.messages(req, res, next));
router.post('/:id/messages', (req, res, next) => chatController.send(req, res, next));

export default router;
