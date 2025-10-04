// super simple Cassidy Proxy — by LUA Programming GOD 🌀
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors"; // <-- ✅ ADD THIS LINE

dotenv.config();

const app = express();

app.use(cors()); // <-- ✅ ADD THIS LINE TOO (before express.json)
app.use(express.json());

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;
const SECRET = process.env.PROXY_SECRET || "changeme123"; // must match your Roblox script

// Quick test route
app.get("/", (req, res) => res.send("✅ Cassidy Proxy running."));

// Handle preflight requests
app.options("*", cors()); // <-- ✅ ADD THIS LINE TOO

app.post("/cassidy", async (req, res) => {
  if (req.get("X-Proxy-Key") !== SECRET)
    return res.status(401).json({ error: "Unauthorized." });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Cassidy proxy on port", port));
