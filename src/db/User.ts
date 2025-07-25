import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_no?: number;
}

const userSchema = new Schema<UserDocument>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_no: { type: Number },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
