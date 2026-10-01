import multer from "multer";
import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({
      success: false,
      message: "Request body contains invalid JSON",
      data: null,
      error: { code: "INVALID_JSON" },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(tooLarge ? 400 : 400).json({
      success: false,
      message: tooLarge ? "The uploaded file exceeds the size limit" : error.message,
      data: null,
      error: { code: tooLarge ? "FILE_TOO_LARGE" : "INVALID_UPLOAD" },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "The requested record was not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({
        success: false,
        message: "A referenced record does not exist",
        data: null,
        error: { code: "INVALID_REFERENCE" },
      });
      return;
    }
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    data: null,
    error: { code: "INTERNAL_SERVER_ERROR" },
  });
};
