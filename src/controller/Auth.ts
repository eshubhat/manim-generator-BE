import { Request, Response } from "express";
import { User } from "../db/User";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User?.findOne({ email });
  if (!user) {
    return res.status(404)?.json({ message: "User not found" });
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
      return res.status(400).json({ error: "Email and password are required" });
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

