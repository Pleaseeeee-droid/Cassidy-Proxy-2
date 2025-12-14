// server.js — Cassidy Proxy (Gemini 3 Pro Preview)
// by LUA Programming GOD 🌀

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// --- CORS ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Proxy-Key"],
  })
);

app.use(express.json({ limit: "50mb" }));

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.send("✅ Cassidy Proxy running (Gemini 3 Pro Preview).");
});

// --- CONFIG ---
const SECRET = process.env.PROXY_SECRET || "changeme123";
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-pro-preview";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

// --- MAIN TEXT ENDPOINT ---
app.post("/cassidy", async (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // 🔹 Flatten messages into ONE prompt (Gemini requirement)
    let prompt = "";
    for (const msg of messages) {
      if (msg?.content) {
        prompt += msg.content + "\n\n";
      }
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "*Cassidy remains silent.*";

    res.json({ reply });

  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

// --- OPTIONAL: VISION ENDPOINT ---
app.post("/cassidy-vision", async (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { image, context } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image data" });
  }

  try {
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: context || "Describe what you see through Samuel's eyes." },
            {
              inlineData: {
                mimeType: "image/png",
                data: image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    const vision =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I see nothing but distortion.";

    res.json({ vision });

  } catch (err) {
    console.error("❌ Gemini vision error:", err);
    res.status(500).json({ error: "Vision request failed" });
  }
});

// --- SERVER START ---
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`✅ Cassidy Proxy (Gemini 3 Pro Preview) running on port ${port}`)
);
