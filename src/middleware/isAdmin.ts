import { NextFunction, Request, Response } from "express";
import { AccountRoles } from "../interfaces/Roles";
import { ErrorObject } from "../helper/error-handler";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.role <= AccountRoles.ADMIN) {
    const error: ErrorObject = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  next();
};
