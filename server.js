// server.js — Cassidy Proxy (Vision-Enabled Edition)
// by LUA Programming GOD 🌀

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// --- CORS SETUP ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Proxy-Key"],
  })
);

// Parse JSON body
app.use(express.json({ limit: "50mb" })); // allow large image payloads

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("✅ Cassidy Proxy running (Vision-Enabled).");
});

// Handle preflight (OPTIONS)
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Proxy-Key");
  res.sendStatus(204);
});

// --- CONFIG ---
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;
const SECRET = process.env.PROXY_SECRET || "changeme123";

// --- TEXT CHAT ENDPOINT ---
app.post("/cassidy", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.get("X-Proxy-Key") !== SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid proxy key." });
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(200).send(data);
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).json({ error: "Proxy error occurred." });
  }
});

// --- NEW: VISION ENDPOINT ---
app.post("/cassidy-vision", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.get("X-Proxy-Key") !== SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid proxy key." });
  }

  const { messages, image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image base64 data." });
  }

  try {
    const payload = {
      model: "gpt-4o-mini", // vision-capable model on OpenRouter
      messages: [
        ...(messages || []),
        {
          role: "user",
          content: [
            { type: "text", text: "Describe what you see in this image briefly and clearly." },
            { type: "image_url", image_url: `data:image/png;base64,${image}` },
          ],
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Return just the descriptive text
    const visionText =
      data?.choices?.[0]?.message?.content ||
      "The vision model returned no description.";

    res.status(200).json({ vision: visionText });
  } catch (err) {
    console.error("❌ Vision proxy error:", err);
    res.status(500).json({ error: "Vision processing failed." });
  }
});

// --- SERVER START ---
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`✅ Cassidy Proxy (Vision-Enabled) active on port ${port}`)
);
