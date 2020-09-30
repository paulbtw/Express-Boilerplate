import { Router } from "express";
import { body } from "express-validator";
import {
  putSignup,
  postLogin,
  getVerification,
  getPasswordReset,
  putPasswordReset,
  postVerify,
  postRequestReset,
  getInfo,
  deleteAccount,
} from "../controllers/userController";
import { isAuth } from "../middleware/isAuth";
import { getRepository } from "typeorm";
import { User } from "../entities/User";

const router = Router();

router.put("/signup", [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid EMail.")
    .custom((value, { req }) => {
      return getRepository(User)
        .findOne({ where: { email: value } })
        .then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already registered!");
          }
        });
    })
    .normalizeEmail(),
  body("password").trim().isLength({ min: 5 }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      return Promise.reject("Passwords are not matching");
    }
    return true;
  }),
  body("name").trim().not().isEmpty(),
  putSignup,
]);

router.post("/login", postLogin);

router.get("/verify/:verificationToken", getVerification);

router.post("/reset", postRequestReset);

router.get("/reset/:passwordToken", getPasswordReset);

router.put("/reset/:passwordToken", putPasswordReset);

router.post("/verify", isAuth, postVerify);

router.get("/info", isAuth, getInfo);

router.delete("/delete", isAuth, deleteAccount);

export default router;
