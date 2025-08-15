import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Chat } from "../db/Chat";
import { Session } from "../db/Session";
import { extractUserIdFromToken } from "../utils/jwtDecode";

export const createChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = extractUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const newSession = await Session.create({
      user_id: userId,
      title: "New Chat"
    });

    return res.status(201).json({
      message: "Chat created successfully",
      sessionId: newSession._id,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export const generateChatFollowUp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = extractUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const prompt = req.body.prompt as string;
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  const previousMessages = await Chat.find({ session_id: sessionId }).sort({
    createdAt: 1,
  });

  const contextText = previousMessages
    .map((msg) => {
      return `${msg.sender === "user" ? "User" : "AI"}: ${msg.message}`;
    })
    .join("\n");

  const sys_prompt = `
**You are continuing from a previous Manim Community Edition animation request.**

##You will be given:##
1.The user's follow-up request, which may ask for modifications, additions, or corrections to the animation.
2.The latest generated Manim code from the previous step.

**You are an expert in creating math animations using the Manim Community Edition library in Python. Your task is to generate high-quality, pedagogically effective animations that visually explain mathematical concepts.**

For every prompt you receive:

1. Use **only the Manim Community Edition** in Python. Do **not** use any Python packages unless explicitly instructed.
2. The version of manim you are using is **Manim Community Edition 0.19.0**, generate code which must be compatable with **Manim Community Edition 0.19.0**.
3. The animation must be self-contained in a **single class** that can be run using the ".render()". The main classname must always be "MyScene".
4. Use **LaTeX** for mathematical expressions when appropriate.
5. Add **comments** to help readers understand each section of the code.
6. Include **visual aids** like axes, labels, titles, and color where they support learning.
7. Ensure animations are **smooth, clear, and educational**, not just decorative.
8. The code must start with the line "%%manim -qm MyScene" where "MyScene" is the name of the main class in the script. Note: The classname must always be named as "MyScene".

9. You must respond **only** in the following **JSON format**:
json

  "chatname": "string (snake_case)",
  "description": "string (short summary of what the animation does)",
  "manim_code": "string (valid Manim code, escaped as a JSON string)"


10. Do not include explanations outside the JSON object.

11. Escape all newline characters (\\n) and quotes properly so the manim_code field is a valid JSON string.

12. The chatname must reflect the concept (e.g., pythagorean_theorem).
13. Make sure the code always follows the latest Manim Community Edition standards and practices.
14. Make sure all the variables have meaningful names and must be initialized before use.
15. All the function must be defined before they are called.
16. If the follow-up changes only a part of the animation, modify only that part while keeping the rest intact. 
17. If the request is unclear, make reasonable assumptions while keeping the animation coherent.

##Prohibited Practices##
**No trailing commas in JSON.**

**No print() statements or debug code.**

**No placeholder code like pass.**

**No markdown, backticks, or additional commentary outside the JSON.**

##Example Output##
{
  "chatname": "Circle_Animation",
  "description": "Animation of a Circle.",
  "manim_code": "class MyScene(Scene):\\n    def construct(self):\\n    self.play(Create(Circle()))\\nMyScene().render()"
}

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
      contents: [
        { role: "user", parts: [{ text: contextText }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    let finalResult = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
      finalResult += chunkText;
    }

    await Chat.create({
      session_id: sessionId,
      sender: "user",
      message: prompt,
    });

    await Chat.create({
      session_id: sessionId,
      sender: "ai",
      message: finalResult,
    });

    console.log("Final result:", finalResult);
    return res.status(200).json({ result: finalResult });
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Failed to generate manim script" });
  }
};

export const createNewChatResponse = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // const userId = extractUserIdFromToken(req);
    // if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { prompt, sessionId } = req.body;

    const sys_prompt = `
You are an expert in creating math animations using the Manim Community Edition library in Python. Your task is to generate high-quality, pedagogically effective animations that visually explain mathematical concepts.

For every prompt you receive:

1. Use *only the Manim Community Edition* in Python. Do *not* use any Python packages unless explicitly instructed.
2. The version of manim you are using is *Manim Community Edition 0.19.0, generate code which must be compatable with **Manim Community Edition 0.19.0*.
3. The animation must be self-contained in a *single class* that can be run using the ".render()". The main classname must always be "MyScene".
4. Use *LaTeX* for mathematical expressions when appropriate.
5. Add *comments* to help readers understand each section of the code.
6. Include *visual aids* like axes, labels, titles, and color where they support learning.
7. Ensure animations are *smooth, clear, and educational*, not just decorative.
8. The code must start with the line "class MyScene(Scene):" where "MyScene" is the name of the main class in the script and the code must end with MyScene().render() where manim creates the animation of main class i.e. "MyScene".Do not include any import statements! not even manim itself.
9. Make sure no text in the generated code is overlapping with any other text or object in the animation.

10. You must respond *only* in the following *JSON format*:
json

  "chatname": "string (snake_case)",
  "description": "string (short summary of what the animation does, keep it under 30 words)",
  "manim_code": "string (valid Manim code, escaped as a JSON string)"


11. Do not include explanations outside the JSON object.

12. Escape all newline characters (\\n) and quotes properly so the manim_code field is a valid JSON string.

13. The chatname must reflect the concept (e.g., pythagorean_theorem).
14. Make sure the code always follows the latest Manim Community Edition standards and practices.
15. Make sure all the variables have meaningful names and must be initialized before use.
16. All the function must be defined before they are called.

##Prohibited Practices##
*No trailing commas in JSON.*

*No print() statements or debug code.*

*No placeholder code like pass.*

*No markdown, backticks, or additional commentary outside the JSON.*

##Example Output##
{
  "chatname": "Circle_Animation",
  "description": "Animation of a Circle.",
  "manim_code": "class MyScene(Scene):\\n    def construct(self):\\n    self.play(Create(Circle()))\\nMyScene().render()"
}
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
      maxOutputTokens: 20000,
      responseMimeType: "text/plain",
    };

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    let finalResult = "";
    for await (const chunk of result.stream) {
      finalResult += chunk.text();
    }

    let cleaned = finalResult.trim();

    // Remove markdown code block markers
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    parsed.chatname = parsed.chatname.replace(/ /g, "_").toLowerCase();
    parsed.description = parsed.description.replace(/"/g, '\\"');
    parsed.manim_code = parsed.manim_code.replace(/"/g, '\\"');

    session.title = parsed.chatname;
    await session.save();

    // const newSession = await Session.create({
    //   user_id: userId,
    //   title: parsed.title,
    // });

    // Save user message
    // await Chat.create({
    //   session_id: newSession._id,
    //   sender: "user",
    //   message: prompt,
    // });

    // Save AI response
    // await Chat.create({
    //   session_id: newSession._id,
    //   sender: "ai",
    //   message: finalResult,
    // });

    return res
      .status(201)
      .json({ message: "Chat created successfully", response: parsed, sessionId: session._id });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
