import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({
    success: true,
    message: "Categories retrieved",
    data: categories,
    error: null,
  });
});

categoriesRouter.get("/:id", async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) {
    throw new ApiError(404, "NOT_FOUND", "Category not found");
  }
  res.json({
    success: true,
    message: "Category retrieved",
    data: category,
    error: null,
  });
});
