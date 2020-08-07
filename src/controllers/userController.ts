import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator/check";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models";
import nodemailer from "nodemailer";
import { ErrorObject } from "../helper/error-handler";
import { Sequelize, Op } from "sequelize";

export const putSignup = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.") as ErrorObject;
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email as string;
  const name = req.body.name as string;
  const password = req.body.password as string;

  let isVerifiedToken = crypto.randomBytes(16).toString("hex");
  let jwtToken: string;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      return User.create({
        name: name,
        password: hashedPassword,
        email: email,
        isVerifiedToken: isVerifiedToken,
      });
    })
    .then((result) => {
      //   jwtToken = jwt.sign(
      //     {
      //       email: result.email,
      //       userId: result.id,
      //       role: result.role,
      //     },
      //     process.env.SECRET as string,
      //     { expiresIn: "7d" }
      //   );
      if (process.env.NODE_ENV === "production") {
        const transporter = nodemailer.createTransport({
          service: "sendgrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASS,
          },
        });
        const mailOptions = {
          from: "no-reply@example.com",
          to: result.email,
          subject: "Account Verification Token",
          text:
            "Hello, \n\nPlease verify your account by clicking the link: \nhttp://" +
            req.headers.host +
            "/confirmation/" +
            result.isVerifiedToken +
            " .\n",
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Message sent: " + info.response);
          }
        });
      }
      res.status(201).json({
        message: "User created!",
        success: true,
      });
    })
    .catch((err) => {
      if (err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const postLogin = (req: Request, res: Response, next: NextFunction) => {
  const email: string = req.body.email;
  const password: string = req.body.password;
  const rememberMe: boolean = req.body.rememberMe;
  let loadedUser: any; // User Object

  User.findOne({ where: { email: email } })
    .then((user) => {
      if (!user) {
        const error: ErrorObject = new Error(
          "E-Mail and password are not matching."
        );
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, loadedUser.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error: ErrorObject = new Error(
          "E-Mail and password are not matching."
        );
        error.statusCode = 401;
        throw error;
      } else if (!loadedUser.isVerified) {
        const error: ErrorObject = new Error("Account not activated.");
        error.statusCode = 401;
        throw error;
      } else if (!loadedUser.isActive) {
        const error: ErrorObject = new Error("Account disabled.");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.id,
          role: loadedUser.role,
        },
        process.env.SECRET as string,
        { expiresIn: rememberMe ? "7d" : "1d" }
      );
      res.status(200).json({
        token: token,
        userId: loadedUser.id,
      });
    })
    .catch((err) => {
      if (err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const verificationToken = req.params.verificationToken;
  User.findOne({ where: { isVerifiedToken: verificationToken } })
    .then((result) => {
      if (!result) {
        const error: ErrorObject = new Error("Verification Token not valid.");
        error.statusCode = 401;
        throw error;
      }
      result.isVerified = true;
      result.isVerifiedToken = null;
      return result.save();
    })
    .then((user) => {
      res.status(201).json({ message: "Account is activated.", success: true });
    })
    .catch((err) => {
      if (err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getPasswordReset = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const passwordToken = req.params.passwordToken;
  if (!passwordToken) {
    const error: ErrorObject = new Error("Token not found.");
    error.statusCode = 400;
    throw error;
  }
  User.findOne({
    where: {
      passwordResetToken: passwordToken,
      passwordResetExpires: {
        [Op.gte]: Sequelize.literal("NOW() - INTERVAL '1h'"),
      },
    },
  })
    .then((result) => {
      if (!result) {
        const error: ErrorObject = new Error("Verification Token not valid.");
        error.statusCode = 401;
        throw error;
      }
      res.status(200).json({ message: "Token is valid.", success: true });
    })
    .catch((err) => {
      if (err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const putPasswordReset = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const passwordToken = req.params.passwordToken;
  const newPassword = req.body.password;
  const newPasswordConfirm = req.body.confirmPassword;
  let user: any; // User Object

  if (newPassword !== newPasswordConfirm) {
    const error: ErrorObject = new Error("Passwords are not matching.");
    error.statusCode = 422;
    throw error;
  }

  User.findOne({
    where: {
      passwordResetToken: passwordToken,
      passwordResetExpires: {
        [Op.gte]: Sequelize.literal("NOW() - INTERVAL '1h'"),
      },
    },
  })
    .then((result) => {
      if (!result) {
        const error: ErrorObject = new Error("Invalid token.");
        error.statusCode = 401;
        throw error;
      }
      user = result;
      return bcrypt.compare(newPassword, result.password);
    })
    .then((isMatching) => {
      if (isMatching) {
        const error: ErrorObject = new Error("Passwords already used.");
        error.statusCode = 422;
        throw error;
      }
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.save();
      return res
        .status(201)
        .json({ message: "Password updated!", success: true });
    })
    .catch((err) => {
      if (err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const postRequestReset = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.body.email;
  let resetToken = crypto.randomBytes(16).toString("hex");
  User.findOne({ where: { email: email } })
    .then((result) => {
      if (!result) {
        const error: ErrorObject = new Error("Email not found.");
        error.statusCode = 401;
        throw error;
      } else if (
        new Date().getTime() - result.passwordResetExpires.getTime() <
        30000
      ) {
        const error: ErrorObject = new Error("Please try again later.");
        error.statusCode = 429;
        throw error;
      }
      result.passwordResetToken = resetToken;
      result.passwordResetExpires = new Date();
      return result.save();
    })
    .then((savedResult) => {
      if (process.env.NODE_ENV === "production") {
        const transporter = nodemailer.createTransport({
          service: "Sendgrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASS,
          },
        });
        const mailOptions = {
          from: "no-reply@test.com",
          to: savedResult.email,
          subject: "Password Reset",
          text:
            "Hello, \n\nTo reset your password click the following link: \nhttp://" +
            req.headers.host +
            "/reset/" +
            savedResult.passwordResetToken +
            " .\n",
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Message sent: " + info.response);
          }
        });
      }
      res.status(201).json({ message: "Reset E-Mail sent!", success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const postVerify = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(true);
};

export const getInfo = (req: Request, res: Response, next: NextFunction) => {
  const userId = res.locals.userId;
  User.findOne({ where: { id: userId }, attributes: { exclude: ["password"] } })
    .then((result) => {
      res.status(200).json({ userInfo: result, success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deleteAccount = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = res.locals.userId;
  User.findOne({ where: { id: userId } })
    .then((result) => {
      if (!result) {
        const error: ErrorObject = new Error("User not found.");
        error.statusCode = 401;
        throw error;
      }
      result.isActive = false;
      result.save();
      return res
        .status(201)
        .json({ success: true, message: "Account deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
