
require("dotenv").config();

const express = require("express");
const { rateLimit } = require("express-rate-limit");

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Check whether the Gemini API key exists
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from .env");
}

// Basic security and request limits
app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));

// Limit excessive API requests
const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // Maximum 10 requests
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many AI requests. Please try again later."
  }
});

// Backend health check
app.get("/", (req, res) => {
  res.json({
    message: "SEO Analyzer API is running!"
  });
});

// Gemini AI endpoint
app.post("/api/gemini", geminiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "A valid prompt is required."
      });
    }

    if (prompt.length > 15000) {
      return res.status(400).json({
        error: "Prompt is too long."
      });
    }

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API returned status:", response.status);

      return res.status(502).json({
        error: "AI service is temporarily unavailable."
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    return res.json({ text });

  } catch (error) {
    console.error("Server error:", error.message);

    if (error.name === "TimeoutError") {
      return res.status(504).json({
        error: "AI request timed out. Please try again."
      });
    }

    return res.status(500).json({
      error: "Something went wrong."
    });
  }
});

app.listen(PORT, () => {
  console.log(`SEO Analyzer backend running on port ${PORT}`);
});
