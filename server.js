// server.js — Cassidy Proxy (Final Fixed Version)
// by LUA Programming GOD 🌀

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// --- CORS SETUP ---
// Allow all origins (for testing / browser access)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Proxy-Key"],
  })
);

// Parse JSON body
app.use(express.json());

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("✅ Cassidy Proxy running and CORS-enabled.");
});

// Handle preflight (OPTIONS) manually to be safe
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

// --- PROXY ENDPOINT ---
app.post("/cassidy", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ensure every response passes CORS

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

// --- SERVER START ---
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Cassidy Proxy active on port ${port}`));
