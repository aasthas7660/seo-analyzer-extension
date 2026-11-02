
require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json({ limit: "100kb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from .env");
}

app.get("/", (req, res) => {
  res.json({ message: "SEO Analyzer API is running!" });
});

app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({
        error: "Gemini API request failed."
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    res.json({ text });

  } catch (error) {
    console.error("Server error:", error.message);

    res.status(500).json({
      error: "Something went wrong."
    });
  }
});

app.listen(PORT, () => {
  console.log(`SEO Analyzer backend running on port ${PORT}`);
});
