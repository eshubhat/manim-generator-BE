import express from "express";
import dotenv from "dotenv";
import Auth from "./routes/Auth";
import { connectToDatabase } from "./db/connection";
import Generate from "./routes/Generate";
const app = express();
const port = 3000;
dotenv.config();

app.use(express.json());

app.use("/api/auth", Auth);
app.use("/api/generate", Generate);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectToDatabase();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
