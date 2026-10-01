import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Router, type Request, type RequestHandler } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { requireMockUser } from "../middleware/mock-auth";
import { ApiError } from "../utils/api-error";

export const itemsRouter = Router();

const conditions = ["WORKING", "DAMAGED", "BROKEN"] as const;
const actions = ["REPAIR", "REUSE", "SELL", "DONATE", "RECYCLE"] as const;
const statuses = ["POSTED", "MATCHED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] as const;
const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getString(
  body: Record<string, unknown>,
  key: string,
  options: { required?: boolean; maxLength?: number } = {},
): string | undefined {
  const value = body[key];
  if (value === undefined && !options.required) {
    return undefined;
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", `${key} must be a non-empty string`);
  }
  const result = value.trim();
  if (options.maxLength && result.length > options.maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${key} must be at most ${options.maxLength} characters`);
  }
  return result;
}

function getOptionalString(body: Record<string, unknown>, key: string, maxLength: number) {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${key} must be a string of at most ${maxLength} characters`);
  }
  return value.trim();
}

function getUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(500, "AUTH_CONTEXT_MISSING", "The authenticated user context is missing");
  }
  return req.user.id;
}

function getItemId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "A valid item id is required");
  }
  return id;
}

function parsePage(value: unknown, fallback: number, max: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new ApiError(400, "VALIDATION_ERROR", `Pagination values must be integers from 1 to ${max}`);
  }
  return parsed;
}

function response(res: Parameters<RequestHandler>[1], data: unknown, message: string, status = 200) {
  res.status(status).json({ success: true, message, data, error: null });
}

async function ensureMockUser(id: string) {
  const email = `mock-${createHash("sha256").update(id).digest("hex")}@users.revivex.local`;
  return prisma.user.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name: "Demo User",
      email,
      passwordHash: "MOCK_AUTH_NO_PASSWORD",
    },
  });
}

export async function createItem(req: Request, res: Parameters<RequestHandler>[1]) {
  const body = req.body as Record<string, unknown>;
  const name = getString(body, "name", { required: true, maxLength: 120 })!;
  const condition = getString(body, "condition", { required: true })!;
  const action = getString(body, "action", { required: true })!;
  const categoryId = getString(body, "categoryId", { required: true })!;
  if (!conditions.includes(condition as (typeof conditions)[number])) {
    throw new ApiError(400, "VALIDATION_ERROR", "condition must be WORKING, DAMAGED, or BROKEN");
  }
  if (!actions.includes(action as (typeof actions)[number])) {
    throw new ApiError(400, "VALIDATION_ERROR", "action must be REPAIR, REUSE, SELL, DONATE, or RECYCLE");
  }
  const brand = getOptionalString(body, "brand", 120);
  const description = getOptionalString(body, "description", 5000);
  const ownerId = getUserId(req);
  await ensureMockUser(ownerId);
  const item = await prisma.item.create({
    data: {
      name,
      condition,
      action,
      categoryId,
      ownerId,
      ...(brand !== undefined ? { brand } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  response(res, item, "Item created", 201);
}

export async function listItems(req: Request, res: Parameters<RequestHandler>[1]) {
  const categoryId = getOptionalQueryString(req.query.categoryId, "categoryId");
  const condition = getOptionalQueryString(req.query.condition, "condition");
  const action = getOptionalQueryString(req.query.action, "action");
  const search = getOptionalQueryString(req.query.search, "search");
  const page = parsePage(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePage(req.query.limit, 20, 100);
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(condition ? { condition } : {}),
    ...(action ? { action } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { brand: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const items = await prisma.item.findMany({
    where,
    include: { category: true, owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  response(res, items, "Items retrieved");
}

function getOptionalQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.length > 200) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a string`);
  }
  return value.trim() || undefined;
}

export async function getItem(req: Request, res: Parameters<RequestHandler>[1]) {
  const item = await prisma.item.findUnique({
    where: { id: getItemId(req) },
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "Item not found");
  }
  response(res, item, "Item retrieved");
}

export async function updateItem(req: Request, res: Parameters<RequestHandler>[1]) {
  const current = await prisma.item.findUnique({ where: { id: getItemId(req) } });
  if (!current) {
    throw new ApiError(404, "NOT_FOUND", "Item not found");
  }
  if (current.ownerId !== getUserId(req)) {
    throw new ApiError(403, "FORBIDDEN", "You cannot update this item");
  }

  const body = req.body as Record<string, unknown>;
  const data: {
    name?: string;
    brand?: string | null;
    condition?: string;
    action?: string;
    description?: string | null;
    categoryId?: string;
    status?: string;
  } = {};
  if ("name" in body) data.name = getString(body, "name", { required: true, maxLength: 120 });
  if ("brand" in body) data.brand = getOptionalString(body, "brand", 120);
  if ("condition" in body) {
    const condition = getString(body, "condition", { required: true })!;
    if (!conditions.includes(condition as (typeof conditions)[number])) {
      throw new ApiError(400, "VALIDATION_ERROR", "condition must be WORKING, DAMAGED, or BROKEN");
    }
    data.condition = condition;
  }
  if ("action" in body) {
    const action = getString(body, "action", { required: true })!;
    if (!actions.includes(action as (typeof actions)[number])) {
      throw new ApiError(400, "VALIDATION_ERROR", "action must be REPAIR, REUSE, SELL, DONATE, or RECYCLE");
    }
    data.action = action;
  }
  if ("description" in body) data.description = getOptionalString(body, "description", 5000);
  if ("categoryId" in body) data.categoryId = getString(body, "categoryId", { required: true });
  if ("status" in body) {
    const status = getString(body, "status", { required: true })!;
    if (!statuses.includes(status as (typeof statuses)[number])) {
      throw new ApiError(400, "VALIDATION_ERROR", "status is not supported");
    }
    Object.assign(data, { status });
  }
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one valid field must be provided");
  }

  const item = await prisma.item.update({
    where: { id: current.id },
    data,
    include: { category: true, owner: { select: { id: true, name: true } } },
  });
  response(res, item, "Item updated");
}

export async function deleteItem(req: Request, res: Parameters<RequestHandler>[1]) {
  const current = await prisma.item.findUnique({ where: { id: getItemId(req) } });
  if (!current) {
    throw new ApiError(404, "NOT_FOUND", "Item not found");
  }
  if (current.ownerId !== getUserId(req)) {
    throw new ApiError(403, "FORBIDDEN", "You cannot delete this item");
  }
  await prisma.item.delete({ where: { id: current.id } });
  response(res, { id: current.id, deleted: true }, "Item deleted");
}

export async function getMyItems(req: Request, res: Parameters<RequestHandler>[1]) {
  const items = await prisma.item.findMany({
    where: { ownerId: getUserId(req) },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  response(res, items, "Your items retrieved");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      callback(new ApiError(400, "INVALID_UPLOAD", "Only JPEG, PNG, and WebP images are supported"));
      return;
    }
    callback(null, true);
  },
});

function hasValidImageSignature(mimetype: string, buffer: Buffer): boolean {
  if (mimetype === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  return mimetype === "image/webp"
    && buffer.length >= 12
    && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP";
}

export async function uploadItemImages(req: Request, res: Parameters<RequestHandler>[1]) {
  const current = await prisma.item.findUnique({ where: { id: getItemId(req) } });
  if (!current) {
    throw new ApiError(404, "NOT_FOUND", "Item not found");
  }
  if (current.ownerId !== getUserId(req)) {
    throw new ApiError(403, "FORBIDDEN", "You cannot upload images to this item");
  }
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, "FILE_REQUIRED", "Select at least one image");
  }
  for (const file of files) {
    if (!hasValidImageSignature(file.mimetype, file.buffer)) {
      throw new ApiError(400, "INVALID_IMAGE", "The file contents do not match a supported image type");
    }
  }

  const uploadDirectory = resolve(process.cwd(), "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  const savedFiles = files.map((file) => ({
    file,
    filename: `${randomUUID()}${allowedTypes[file.mimetype]}`,
  }));
  await Promise.all(savedFiles.map(({ file, filename }) =>
    writeFile(resolve(uploadDirectory, filename), file.buffer, { flag: "wx" }),
  ));
  const urls = savedFiles.map(({ filename }) => `${req.protocol}://${req.get("host")}/uploads/${filename}`);
  await prisma.item.update({
    where: { id: current.id },
    data: { images: [...current.images, ...urls] },
  });
  response(res, urls, "Item images uploaded", 201);
}

itemsRouter.post("/", requireMockUser, createItem);
itemsRouter.get("/", listItems);
itemsRouter.post("/:id/images", requireMockUser, upload.array("images", 5), uploadItemImages);
itemsRouter.get("/:id", getItem);
itemsRouter.put("/:id", requireMockUser, updateItem);
itemsRouter.delete("/:id", requireMockUser, deleteItem);
