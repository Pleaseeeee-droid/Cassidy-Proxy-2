// server.js — Cassidy Proxy (Gemini 3 Pro Native)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
// FIX: Render requires binding to 0.0.0.0 and using their assigned PORT
const port = process.env.PORT || 10000; 

// --- CONFIG ---
// FIX: Using the officially supported Gemini 3 Pro identifier
const MODEL_NAME = "gemini-3-pro-preview"; 
const API_KEY = process.env.GEMINI_API_KEY;
const SECRET = process.env.PROXY_SECRET || "Cassidy123";
const MEMORY_FILE = path.resolve("memory.json");

const genAI = new GoogleGenerativeAI(API_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- MEMORY UTILS ---
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({
    core_memories: "My name is Cassidy.",
    user_facts: "The user is a Roblox developer.",
    current_context: "Working on a script."
  }, null, 2));
}

function getMemory() {
  const data = fs.readFileSync(MEMORY_FILE, "utf8");
  return JSON.parse(data);
}

function getSystemInstruction() {
  const mem = getMemory();
  return `You are Cassidy. [MEMORY]: ${mem.core_memories} [CONTEXT]: ${mem.current_context}`;
}

// --- ROUTES ---

// Health Check
app.get("/", (req, res) => {
  res.send(`✅ Cassidy Proxy Online | Model: ${MODEL_NAME}`);
});

// Main Chat Endpoint
app.post("/cassidy", async (req, res) => {
  // Check the secret from your Roblox script
  if (req.get("X-Proxy-Key") !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1].content;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: getSystemInstruction()
    });

    const result = await model.generateContent(lastMessage);
    const response = await result.response;
    const text = response.text();

    // FIX: This format matches exactly what your Roblox script (sendToCassidy) expects
    res.json({ 
      choices: [{ 
        message: { role: "assistant", content: text } 
      }] 
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Bind to 0.0.0.0 for Render compatibility
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Proxy active on port ${port}`);
});
