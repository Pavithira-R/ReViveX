import "dotenv/config";
import express from "express";
import cors from "cors";
import { resolve } from "node:path";
import { categoriesRouter } from "./routes/categories";
import { itemsRouter } from "./routes/items";
import { usersRouter } from "./routes/users";
import { errorHandler } from "./middleware/error-handler";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    data: { status: "ok" },
    error: null,
  });
});

const apiRouter = express.Router();
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/items", itemsRouter);
app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
    error: { code: "NOT_FOUND" },
  });
});

app.use(errorHandler);
