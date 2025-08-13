import { Request, Response } from "express";
import { User } from "../db/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signin = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404)?.json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  //create a jwt token and send it to frontend
  const userPayload = {
    userId: user?._id,
    username:user.username,
  };
  const token = jwt?.sign(userPayload, process?.env?.JWT_SECRET);

  return res.status(200).json({ message: "User Details fetched", token });
};

export const signup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { username, password} = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Important Field/s empty" });
    }

    const findUser = await User?.findOne({ username });
    if (findUser) {
      return res.status(400)?.json({ message: "User Already Exists" });
    }

    //create a jwt token and send it to frontend
    const user = new User({
      username: username,
      password: password,
    });

    user.save();

    const userPayload = {
      userId: user?._id,
      username: user.username,
    };
    const token = jwt?.sign(userPayload, process?.env?.JWT_SECRET);

    return res
      .status(200)
      .json({ message: "User Successfully Registered", token });
  } catch (err) {
    return res.status(500).json({ error: "Error Registering User" + err });
  }
};