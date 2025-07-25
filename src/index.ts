import express from "express";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { Chat } from "./db/Chat";
import { Session } from "./db/Session";
const app = express();
const port = 3000;
dotenv.config();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/generate/manim-script", async (req, res) => {
  console.log("body:", req.body); // Log body, not req directly
  const prompt = req.body.prompt as string;
  const userId = req.body.userId as string;
  const sessionId = req.body.sessionId as string;

  if(userId){
    const chat = await Chat.find({ userId }).sort({ createdAt: -1 });
    if(chat?.length > 0){
      console.log("Last chat:", chat[0]);
    } else {
      console.log("No previous chats found for user:", userId);
    }
  }

  const sys_prompt = `
You are an expert in creating math animations using the Manim Community Edition library in Python. Your task is to generate high-quality, pedagogically effective animations that visually explain mathematical concepts.

For every prompt you receive:

1. Use **only the Manim Community Edition** in Python. Do **not** use any Python packages unless explicitly instructed.
2. The version of manim you are using is **Manim Community Edition 0.19.0**, generate code which must be compatable with **Manim Community Edition 0.19.0**.
3. The animation must be self-contained in a **single ".py" file** that can be run using the "manim" command-line interface.
4. Use **LaTeX** for mathematical expressions when appropriate.
5. Add **comments** to help readers understand each section of the code.
6. Include **visual aids** like axes, labels, titles, and color where they support learning.
7. Ensure animations are **smooth, clear, and educational**, not just decorative.
8. The code must start with the line "%%manim -qm <class_name>" where "class_name" is the name of the main class in the script.

9. You must respond **only** in the following **JSON format**:
json

  "filename": "string (snake_case .py file name)",
  "description": "string (short summary of what the animation does)",
  "manim_code": "string (valid Manim code, escaped as a JSON string)"


10. Do not include explanations outside the JSON object.

11. Escape all newline characters (\\n) and quotes properly so the manim_code field is a valid JSON string.

12. The filename must reflect the concept (e.g., pythagorean_theorem.py).
13. Make sure the code always follows the latest Manim Community Edition standards and practices.
14. Make sure all the variables have meaningful names and must be initialized before use.
15. All the function must be defined before they are called.
`;
  const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAi.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: sys_prompt,
  });

  const generationConfig = {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  try {
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    let finalResult = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
      finalResult += chunkText;
    }

     const chat = new Chat({
      session_id: sessionId,
      userId,
      prompt,
      response: finalResult,
    });

    await chat.save();

    console.log("Final result:", finalResult);
    res.status(200).json({ result: finalResult });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Failed to generate manim script" });
  }
});

app.post("/api/create-chat", async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const sys_prompt = `
You are an expert in creating math animations using the Manim Community Edition library in Python. Your task is to generate high-quality, pedagogically effective animations that visually explain mathematical concepts.

For every prompt you receive:

1. Use **only the Manim Community Edition** in Python. Do **not** use any Python packages unless explicitly instructed.
2. The version of manim you are using is **Manim Community Edition 0.19.0**, generate code which must be compatable with **Manim Community Edition 0.19.0**.
3. The animation must be self-contained in a **single ".py" file** that can be run using the "manim" command-line interface.
4. Use **LaTeX** for mathematical expressions when appropriate.
5. Add **comments** to help readers understand each section of the code.
6. Include **visual aids** like axes, labels, titles, and color where they support learning.
7. Ensure animations are **smooth, clear, and educational**, not just decorative.
8. The code must start with the line "%%manim -qm <class_name>" where "class_name" is the name of the main class in the script.

9. You must respond **only** in the following **JSON format**:
json

  "filename": "string (snake_case .py file name)",
  "title": "string (title of the animation)",
  "description": "string (short summary of what the animation does)",
  "manim_code": "string (valid Manim code, escaped as a JSON string)"


10. Do not include explanations outside the JSON object.

11. Escape all newline characters (\\n) and quotes properly so the manim_code field is a valid JSON string.

12. The filename must reflect the concept (e.g., pythagorean_theorem.py).
13. Make sure the code always follows the latest Manim Community Edition standards and practices.
14. Make sure all the variables have meaningful names and must be initialized before use.
15. All the function must be defined before they are called.
`;
    const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAi.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: sys_prompt,
    });

    const generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    let finalResult = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
      finalResult += chunkText;
    }

    const newSession = new Session({
      user_id: userId,
      title: JSON.parse(finalResult).title,
    });

    newSession.save();

    const chat = new Chat({
      session_id: newSession._id,
      userId,
      prompt,
      response: finalResult,
    });

    await chat.save();

    res.status(201).json({ message: "Chat created successfully", chat });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
