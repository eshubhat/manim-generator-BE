import mongoose, { Schema, Document, Model } from "mongoose";

interface SessionDocument extends Document {
  user_id: string;
  title: string;
}

const SessionDocument = new Schema<SessionDocument>(
  {
    user_id: { type: String, required: true },
    title: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model<SessionDocument>("Session", SessionDocument);
