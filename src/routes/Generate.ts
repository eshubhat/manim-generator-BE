import express from "express";
import { createChat, generateChatFollowUp } from "../controller/Generate";

const router = express.Router();

router.post("/chat/new", createChat);
router.post("/chat/followup", generateChatFollowUp)

export default router;
