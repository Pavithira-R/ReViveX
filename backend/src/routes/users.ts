import { Router } from "express";
import { requireMockUser } from "../middleware/mock-auth";
import { getMyItems } from "./items";

export const usersRouter = Router();

usersRouter.get("/me/items", requireMockUser, getMyItems);
