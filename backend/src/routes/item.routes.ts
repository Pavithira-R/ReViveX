// Member 2 – Item Management
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Router, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware';
import prisma from '../utils/prisma';
import { AppError, sendSuccess } from '../utils';
import { Prisma } from '@prisma/client';
import { awardEcoPoints, notify } from '../services';

const conditions = ['WORKING', 'DAMAGED', 'BROKEN'] as const;
const actions = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'] as const;
const statuses = ['POSTED', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const;
const ecoCategories: Record<string, string> = {
  'Mobile Phones': 'PHONE',
  Laptops: 'LAPTOP',
  Tablets: 'TABLET',
  Desktops: 'DESKTOP',
  Monitors: 'MONITOR',
  Printers: 'PRINTER',
  Headphones: 'HEADPHONES',
  Keyboards: 'KEYBOARD',
  Cameras: 'CAMERA',
  'Batteries & Chargers': 'BATTERY_CHARGER',
};
const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const router = Router();

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

const handle = (fn: AsyncHandler): RequestHandler => (req, res, next) => {
  void fn(req, res).catch(next);
};

function getRequiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${key} must be a non-empty string`, 400, 'VALIDATION_ERROR');
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new AppError(`${key} must be at most ${maxLength} characters`, 400, 'VALIDATION_ERROR');
  }
  return result;
}

function getOptionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new AppError(`${key} must be a string of at most ${maxLength} characters`, 400, 'VALIDATION_ERROR');
  }
  return value.trim();
}

function getOptionalQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > 200) {
    throw new AppError(`${field} must be a string`, 400, 'VALIDATION_ERROR');
  }
  return value.trim() || undefined;
}

function parsePage(value: unknown, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new AppError(`Pagination values must be integers from 1 to ${max}`, 400, 'VALIDATION_ERROR');
  }
  return parsed;
}

function getItemId(req: Request): string {
  const id = req.params.id;
  if (!id?.trim()) {
    throw new AppError('A valid item id is required', 400, 'VALIDATION_ERROR');
  }
  return id;
}

function hasValidImageSignature(mimetype: string, buffer: Buffer): boolean {
  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  return mimetype === 'image/webp'
    && buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      callback(new AppError('Only JPEG, PNG, and WebP images are supported', 400, 'INVALID_UPLOAD'));
      return;
    }
    callback(null, true);
  },
});

const parseImages: RequestHandler = (req, res, next) => {
  upload.array('images', 5)(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(new AppError(error.message, 400, 'INVALID_UPLOAD'));
      return;
    }
    next(error);
  });
};

async function createItem(req: Request, res: Response): Promise<Response> {
  const body = req.body as Record<string, unknown>;
  const name = getRequiredString(body, 'name', 120);
  const condition = getRequiredString(body, 'condition', 40);
  const action = getRequiredString(body, 'action', 40);
  const categoryId = getRequiredString(body, 'categoryId', 200);
  if (!conditions.includes(condition as (typeof conditions)[number])) {
    throw new AppError('condition must be WORKING, DAMAGED, or BROKEN', 400, 'VALIDATION_ERROR');
  }
  if (!actions.includes(action as (typeof actions)[number])) {
    throw new AppError('action must be REPAIR, REUSE, SELL, DONATE, or RECYCLE', 400, 'VALIDATION_ERROR');
  }
  if (!await prisma.category.findUnique({ where: { id: categoryId } })) {
    throw new AppError('Category not found', 400, 'INVALID_CATEGORY');
  }

  const brand = getOptionalString(body, 'brand', 120);
  const description = getOptionalString(body, 'description', 5000);
  const item = await prisma.item.create({
    data: {
      name,
      condition,
      action,
      categoryId,
      ownerId: req.user!.id,
      ...(brand !== undefined ? { brand } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  return sendSuccess(res, 'Item created', item, 201);
}

async function listItems(req: Request, res: Response): Promise<Response> {
  const categoryId = getOptionalQueryString(req.query.categoryId, 'categoryId');
  const condition = getOptionalQueryString(req.query.condition, 'condition');
  const action = getOptionalQueryString(req.query.action, 'action');
  const status = getOptionalQueryString(req.query.status, 'status');
  const search = getOptionalQueryString(req.query.search, 'search');
  const page = parsePage(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePage(req.query.limit, 20, 100);
  const where: Prisma.ItemWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(condition ? { condition } : {}),
    ...(action ? { action } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const items = await prisma.item.findMany({
    where,
    include: { category: true, owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return sendSuccess(res, 'Items retrieved', items);
}

async function getItem(req: Request, res: Response): Promise<Response> {
  const item = await prisma.item.findUnique({
    where: { id: getItemId(req) },
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  if (!item) throw new AppError('Item not found', 404, 'NOT_FOUND');
  return sendSuccess(res, 'Item retrieved', item);
}

async function updateItem(req: Request, res: Response): Promise<Response> {
  const id = getItemId(req);
  const current = await prisma.item.findUnique({ where: { id } });
  if (!current) throw new AppError('Item not found', 404, 'NOT_FOUND');
  if (current.ownerId !== req.user!.id) {
    throw new AppError('You cannot update this item', 403, 'FORBIDDEN');
  }

  const body = req.body as Record<string, unknown>;
  const data: Prisma.ItemUncheckedUpdateInput = {};
  if ('name' in body) data.name = getRequiredString(body, 'name', 120);
  if ('brand' in body) data.brand = getOptionalString(body, 'brand', 120);
  if ('condition' in body) {
    const condition = getRequiredString(body, 'condition', 40);
    if (!conditions.includes(condition as (typeof conditions)[number])) {
      throw new AppError('condition must be WORKING, DAMAGED, or BROKEN', 400, 'VALIDATION_ERROR');
    }
    data.condition = condition;
  }
  if ('action' in body) {
    const action = getRequiredString(body, 'action', 40);
    if (!actions.includes(action as (typeof actions)[number])) {
      throw new AppError('action must be REPAIR, REUSE, SELL, DONATE, or RECYCLE', 400, 'VALIDATION_ERROR');
    }
    data.action = action;
  }
  if ('description' in body) data.description = getOptionalString(body, 'description', 5000);
  if ('categoryId' in body) data.categoryId = getRequiredString(body, 'categoryId', 200);
  if ('status' in body) {
    const status = getRequiredString(body, 'status', 40);
    if (!statuses.includes(status as (typeof statuses)[number])) {
      throw new AppError('status is not supported', 400, 'VALIDATION_ERROR');
    }
    data.status = status;
  }
  if (Object.keys(data).length === 0) {
    throw new AppError('At least one valid field must be provided', 400, 'VALIDATION_ERROR');
  }

  const item = await prisma.item.update({
    where: { id },
    data,
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  if (item.status === 'COMPLETED' && current.status !== 'COMPLETED') {
    await awardEcoPoints(
      item.ownerId,
      item.action as 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE',
      item.id,
      item.category ? ecoCategories[item.category.name] : undefined,
    );
    await notify(item.ownerId, 'Item completed', `"${item.name}" has been given another life.`, {
      type: 'LISTING',
      refId: item.id,
    });
  }
  return sendSuccess(res, 'Item updated', item);
}

async function deleteItem(req: Request, res: Response): Promise<Response> {
  const id = getItemId(req);
  const current = await prisma.item.findUnique({ where: { id } });
  if (!current) throw new AppError('Item not found', 404, 'NOT_FOUND');
  if (current.ownerId !== req.user!.id) {
    throw new AppError('You cannot delete this item', 403, 'FORBIDDEN');
  }
  await prisma.item.delete({ where: { id } });
  return sendSuccess(res, 'Item deleted', { id, deleted: true });
}

export async function getMyItems(req: Request, res: Response): Promise<Response> {
  const items = await prisma.item.findMany({
    where: { ownerId: req.user!.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, 'Your items retrieved', items);
}

async function uploadItemImages(req: Request, res: Response): Promise<Response> {
  const id = getItemId(req);
  const current = await prisma.item.findUnique({ where: { id } });
  if (!current) throw new AppError('Item not found', 404, 'NOT_FOUND');
  if (current.ownerId !== req.user!.id) {
    throw new AppError('You cannot upload images to this item', 403, 'FORBIDDEN');
  }
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError('Select at least one image', 400, 'FILE_REQUIRED');
  }
  if (current.images.length + files.length > 5) {
    throw new AppError('An item can have at most 5 images', 400, 'INVALID_UPLOAD');
  }
  if (files.some((file) => !hasValidImageSignature(file.mimetype, file.buffer))) {
    throw new AppError('The file contents do not match a supported image type', 400, 'INVALID_IMAGE');
  }

  const uploadDirectory = resolve(process.cwd(), 'uploads');
  await mkdir(uploadDirectory, { recursive: true });
  const savedFiles = files.map((file) => ({
    file,
    filename: `${randomUUID()}${allowedTypes[file.mimetype]}`,
  }));
  const urls = savedFiles.map(({ filename }) => `${req.protocol}://${req.get('host')}/uploads/${filename}`);
  try {
    await Promise.all(savedFiles.map(({ file, filename }) =>
      writeFile(resolve(uploadDirectory, filename), file.buffer, { flag: 'wx' }),
    ));
    await prisma.item.update({
      where: { id },
      data: { images: [...current.images, ...urls] },
    });
  } catch (error) {
    await Promise.all(savedFiles.map(({ filename }) =>
      unlink(resolve(uploadDirectory, filename)).catch(() => undefined),
    ));
    throw error;
  }
  return sendSuccess(res, 'Item images uploaded', urls, 201);
}

router.use(authenticate);
router.post('/', handle(createItem));
router.get('/', handle(listItems));
router.post('/:id/images', parseImages, handle(uploadItemImages));
router.get('/:id', handle(getItem));
router.put('/:id', handle(updateItem));
router.delete('/:id', handle(deleteItem));

export default router;