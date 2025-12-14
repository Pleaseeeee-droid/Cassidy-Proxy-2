// server.js — Cassidy Proxy (Gemini Native + Memory Bank)
// by LUA Programming GOD 🌀

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CONFIG ---
// We use gemini-1.5-pro for "High Reasoning". 
// You can switch this to "gemini-2.0-flash-thinking-exp-1219" if you have access to the experimental thinking models.
const MODEL_NAME = "gemini-3-pro-preview"; 
const API_KEY = process.env.GEMINI_API_KEY; // Make sure this is in your .env
const SECRET = process.env.PROXY_SECRET || "Cassidy123";
const MEMORY_FILE = path.resolve("memory.json");

// Initialize Google AI
const genAI = new GoogleGenerativeAI(API_KEY);

// --- MIDDLEWARE ---
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "50mb" })); // Large limit for Roblox screenshots

// --- MEMORY BANK UTILS ---
// Initializes memory file if it doesn't exist
if (!fs.existsSync(MEMORY_FILE)) {
  const initialData = {
    core_memories: "My name is Cassidy. I am a helpful AI assistant.",
    user_facts: "The user is a Roblox developer.",
    current_context: "We are currently working on a script."
  };
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(initialData, null, 2));
}

function getMemory() {
  try {
    const data = fs.readFileSync(MEMORY_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function updateMemory(newMemory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(newMemory, null, 2));
}

// --- SYSTEM INSTRUCTION BUILDER ---
// Combines static persona with dynamic memory
function getSystemInstruction() {
  const mem = getMemory();
  return `
    You are Cassidy, an intelligent and helpful AI assistant.
    
    [MEMORY BANK - PERMANENT]
    ${mem.core_memories}
    
    [USER FACTS]
    ${mem.user_facts}
    
    [CURRENT PROJECT CONTEXT]
    ${mem.current_context}
    
    INSTRUCTIONS:
    - Use the Memory Bank to inform your answers.
    - If the user asks you to remember something specific, confirm you have noted it (the user will manually update the bank via API, just acknowledge it).
    - When analyzing images (Roblox), look for UI elements, scripts, and 3D environment details.
  `;
}

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.send(`✅ Cassidy Proxy running. Model: ${MODEL_NAME}`);
});

// --- ENDPOINT 1: TEXT CHAT (With Memory Injection) ---
app.post("/cassidy", async (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { messages } = req.body;
    
    // Get the latest message content
    const lastMessage = messages[messages.length - 1].content;

    // Initialize model with dynamic system instruction (Memory)
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: getSystemInstruction()
    });

    // Generate content
    const result = await model.generateContent(lastMessage);
    const response = await result.response;
    const text = response.text();

    // Mimic OpenAI/OpenRouter structure for compatibility if needed, or send raw text
    res.json({ 
      id: "chatcmpl-cassidy",
      choices: [{ message: { role: "assistant", content: text } }] 
    });

  } catch (err) {
    console.error("❌ Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT 2: VISION (Roblox Optimized) ---
app.post("/cassidy-vision", async (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  const { messages, image } = req.body; // Expecting 'image' as base64 string (no header)

  if (!image) return res.status(400).json({ error: "Missing image data" });

  try {
    // We use the same model (1.5 Pro) because it is multimodal native
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: getSystemInstruction() // Cassidy "sees" with her memory intact
    });

    const userPrompt = messages?.length > 0 
      ? messages[messages.length - 1].content 
      : "Describe what you see in this Roblox screenshot. Detail the UI, scripts, or 3D elements.";

    const result = await model.generateContent([
      userPrompt,
      {
        inlineData: {
          data: image,
          mimeType: "image/png",
        },
      },
    ]);

    const visionText = result.response.text();
    res.json({ vision: visionText });

  } catch (err) {
    console.error("❌ Vision Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT 3: MEMORY MANAGEMENT (Direct Edit) ---
// GET /memory -> Reads the bank
// POST /memory -> Overwrites the bank
app.get("/memory", (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) return res.status(401).json({ error: "Unauthorized" });
  res.json(getMemory());
});

app.post("/memory", (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) return res.status(401).json({ error: "Unauthorized" });
  
  const newMemory = req.body;
  if (!newMemory || typeof newMemory !== 'object') {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  updateMemory(newMemory);
  res.json({ success: true, message: "Memory Bank Updated", current: newMemory });
});

// --- START ---
app.listen(port, () =>
  console.log(`✅ Cassidy Proxy active on port ${port} | Vision & Memory Enabled`)
);
