import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ErrorObject } from "../helper/error-handler";

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.get("x-auth-token");
  if (!headerToken) {
    const error: ErrorObject = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(headerToken, process.env.SECRET as string);
  } catch (error) {
    error.statusCode = 401;
    error.message = "Unauthorized";
    throw error;
  }
  if (!decodedToken) {
    const error: ErrorObject = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  // @ts-ignore
  res.locals.userId = decodedToken.userId;
  // @ts-ignore
  res.locals.role = decodedToken.role;
  next();
};
