import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // optional for OAuth
  phone_no?: number;
  provider?: "google" | "github" | "credentials";
  oauthId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // now optional
    phone_no: { type: Number },
    provider: {
      type: String,
      enum: ["google", "github", "credentials"],
      default: "credentials",
    },
    oauthId: { type: String }, // from Google or GitHub
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.provider !== "credentials") return next(); // skip if OAuth user
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (this.provider !== "credentials") {
    throw new Error("Password authentication not allowed for OAuth user.");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDocument>("User", userSchema);
