import mongoose, { Schema, Document, Model } from "mongoose";

interface ChatDocument extends Document {
    session_id: string;
    sender: string;
    message: string;
}

const ChatSchema = new Schema<ChatDocument>({
    session_id: { type: String, required: true },
    sender: { type: String, required: true },
    message: { type: String, required: true },
}, {
    timestamps: true
})

export const Chat = mongoose.model<ChatDocument>("Chat", ChatSchema);