// Member 2 – Item Management
import { Router, type Request, type RequestHandler, type Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, sendSuccess } from '../utils';

const router = Router();

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

const handle = (fn: AsyncHandler): RequestHandler => (req, res, next) => {
  void fn(req, res).catch(next);
};

router.get('/', handle(async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return sendSuccess(res, 'Categories retrieved', categories);
}));

router.get('/:id', handle(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  return sendSuccess(res, 'Category retrieved', category);
}));

export default router;