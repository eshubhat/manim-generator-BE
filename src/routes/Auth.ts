import express from "express";
import passport from "passport";
import { initiateOAuthLogin, login, oAuthCallback, signup } from "../controller/Auth";

const router = express.Router();

// Initiate Google login
router.get("/auth/google", initiateOAuthLogin);

// Callback route
router.get("/auth/google/callback",passport.authenticate("google", {
    failureRedirect: "/login",
    session: true
  }),
  oAuthCallback
);

router.post("/login", login);
router.post("/signup", signup)

export default router;
