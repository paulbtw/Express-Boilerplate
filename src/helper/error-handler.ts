import { Request, Response, NextFunction } from "express";

export interface ErrorObject extends Error {
  statusCode?: number;
  data?: any;
}

export const errorHandler = (
  err: ErrorObject,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (typeof err === "string") {
    return res.status(400).json({ message: err });
  }
  if (err.name === "UnauthorizedError") {
    // jwt error
    return res.status(401).json({ message: "Invalid Token!" });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message });
};
