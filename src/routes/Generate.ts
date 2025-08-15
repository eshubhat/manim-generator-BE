import express from "express";
import { createChat, createNewChatResponse, generateChatFollowUp } from "../controller/Generate";

const router = express.Router();

router.post("/chat/new", createChat);
router.post("/chat/new/prompt", createNewChatResponse);
router.post("/chat/followup", generateChatFollowUp)

export default router;
