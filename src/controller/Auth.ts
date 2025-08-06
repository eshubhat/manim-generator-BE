import { NextFunction, Request, Response } from "express";
import { User } from "../db/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404)?.json({ message: "User not found" });
  }

  if (user.provider !== "credentials") {
    return res
      .status(400)
      .json({ message: `Use ${user.provider} to sign in.` });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  //create a jwt token and send it to frontend
  const userPayload = {
    userId: user?._id,
    firstName: user.first_name,
    lastName: user?.last_name,
  };
  const token = jwt?.sign(userPayload, process?.env?.JWT_SECRET);

  return res.status(200).json({ message: "User Details fetched", token });
};

export const signup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Important Field/s empty" });
    }

    const findUser = await User?.findOne({ email });
    if (findUser) {
      return res.status(400)?.json({ message: "User Already Exists" });
    }

    //create a jwt token and send it to frontend
    const user = new User({
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
    });

    user.save();

    const userPayload = {
      userId: user?._id,
      firstName: user.first_name,
      lastName: user?.last_name,
    };
    const token = jwt?.sign(userPayload, process?.env?.JWT_SECRET);

    return res
      .status(200)
      .json({ message: "User Successfully Registered", token });
  } catch (err) {
    return res.status(500).json({ error: "Error Registering User" + err });
  }
};

export const initiateOAuthLogin = (req: Request, res: Response) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  });
};

export const oAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("google", async (err: Error, user: typeof User) => {
    if (err || !user) return res.redirect("/login");

    const token = jwt.sign(user, process?.env?.JWT_SECRET);
    res.status(200).json({message: "User fetched", token});
  })(req, res, next);
};
