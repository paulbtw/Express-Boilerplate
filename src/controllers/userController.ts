import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator/check";
import crypto from "crypto";
import { User } from "../entities/User";
import nodemailer from "nodemailer";
import { ErrorObject } from "../helper/error-handler";
import { getRepository } from "typeorm";
import { sendEmail } from "../helper/mailer";

export const putSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.") as ErrorObject;
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }
    const { email, name, password } = req.body;

    const isVerifiedToken = crypto.randomBytes(16).toString("hex");

    const newUser = new User();
    newUser.name = name;
    newUser.email = email;
    newUser.password = password;
    newUser.isVerifiedToken = isVerifiedToken;

    await getRepository(User).save(newUser);

    sendEmail(email, isVerifiedToken);

    res.status(201).json({
      message: "User created!",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export const postLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await getRepository(User).findOne({ where: { email: email } });
    if (!user) {
      const error: ErrorObject = new Error(
        "E-Mail and password are not matching."
      );
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await user.comparePassword(password);

    if (!isEqual) {
      const error: ErrorObject = new Error("Email password not matching.");
      error.statusCode = 401;
      throw error;
    }

    const duration = rememberMe ? "7d" : "1d";

    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
        role: user.role,
      },
      process.env.SECRET as string,
      { expiresIn: duration }
    );

    res.status(200).json({
      token: token,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};

export const getVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { verificationToken } = req.params;

  try {
    const user = await getRepository(User).update(
      { isVerifiedToken: verificationToken },
      { isVerifiedToken: null, isVerified: true }
    );

    if (!user.affected) {
      const error: ErrorObject = new Error("Not a valid token.");
      error.statusCode = 401;
      throw error;
    }

    return res
      .status(201)
      .json({ success: true, message: "Account is activated" });
  } catch (err) {
    next(err);
  }
};

export const getPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { passwordToken } = req.params;
  try {
    if (!passwordToken) {
      const error: ErrorObject = new Error("Token not found.");
      error.statusCode = 400;
      throw error;
    }

    const user = await getRepository(User).findOne({
      where: { passwordResetToken: passwordToken },
    });

    if (!user) {
      const error: ErrorObject = new Error("Reset Token not valid.");
      error.statusCode = 401;
      throw error;
    }

    res.status(200).json({ message: "Token is valid.", success: true });
  } catch (err) {
    next(err);
  }
};

export const putPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { passwordToken } = req.params;
  const { newPassword, newPasswordConfirm } = req.body;

  let user: any; // User Object

  try {
    const userRepository = await getRepository(User);

    const user = await userRepository.findOne({
      where: { passwordResetToken: passwordToken },
    });

    if (!user) {
      const error: ErrorObject = new Error("Reset Token not valid.");
      error.statusCode = 401;
      throw error;
    }

    if (newPassword !== newPasswordConfirm) {
      const error: ErrorObject = new Error("Passwords need to match.");
      error.statusCode = 401;
      throw error;
    }

    const isEqual = user.comparePassword(newPassword);

    if (isEqual) {
      const error: ErrorObject = new Error("Passwords already used.");
      error.statusCode = 422;
      throw error;
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    await userRepository.save(user);

    return res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const postRequestReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  try {
    const user = await getRepository(User).findOne({ where: { email: email } });
    if (!user) {
      const error: ErrorObject = new Error("Email not found.");
      error.statusCode = 401;
      throw error;
    } else if (
      user.passwordResetExpires &&
      new Date().getTime() - user.passwordResetExpires.getTime() < 30000
    ) {
      const error: ErrorObject = new Error("Please try again later.");
      error.statusCode = 429;
      throw error;
    }
    user.passwordResetToken = crypto.randomBytes(16).toString("hex");
    user.passwordResetExpires = new Date();

    await getRepository(User).save(user);

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
        to: user.email,
        subject: "Password Reset",
        text:
          "Hello, \n\nTo reset your password click the following link: \nhttp://" +
          req.headers.host +
          "/reset/" +
          user.passwordResetToken +
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
  } catch (err) {
    next(err);
  }
};

export const postVerify = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(true);
};

export const getInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = res.locals;
  try {
    const user = await getRepository(User).findOne({ where: { id: userId } });

    res.status(200).json({ userInfo: user?.getInfo(), success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = res.locals;
  try {
    const user = await getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
      const error: ErrorObject = new Error("User not found.");
      error.statusCode = 401;
      throw error;
    }

    user.isActive = false;
    await getRepository(User).save(user);

    return res.status(201).json({ success: true, message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};
