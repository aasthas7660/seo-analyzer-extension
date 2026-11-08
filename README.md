
# 🔍 SEO Analyzer — Chrome Extension
<p align="left">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript" />
  <img src="https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome" />
  <img src="https://img.shields.io/badge/Manifest-V3-blue" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express.js-brightgreen?logo=nodedotjs" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=googlegemini" />
</p>

**Analyze blog-page SEO, identify issues, and get actionable recommendations without leaving your browser.**

SEO Analyzer is a Chrome extension built using **Manifest V3** that analyzes the on-page and technical SEO elements of published blog posts.

It calculates an SEO score out of 100, highlights issues using Pass / Warning / Fail statuses, and provides practical recommendations to improve blog SEO. It also includes an optional AI-powered feature that uses the Google Gemini API to generate additional suggestions.

---

## ✨ Features

### 📄 1. On-Page SEO Analysis

- Checks page titles and meta descriptions.
- Reviews heading structure, including H1, H2, and H3 tags.
- Counts words in the detected article content.
- Identifies frequently used keywords.
- Supports Unicode-aware keyword analysis for English and Hindi (Devanagari).
- Checks image alt-text coverage.
- Counts internal and external links.

### ⚙️ 2. Technical SEO Analysis

- Checks for canonical URLs.
- Detects `noindex` robots directives.
- Verifies HTTPS usage.
- Checks for viewport meta tags.
- Detects Schema.org structured data (JSON-LD).
- Checks Open Graph metadata.

### 📊 3. SEO Score & Recommendations

- Calculates a weighted SEO score from 0 to 100.
- Displays Pass, Warning, and Fail statuses for individual checks.
- Identifies SEO issues.
- Provides actionable, plain-language recommendations.

### 🤖 4. AI-Powered Suggestions

- Generates additional SEO suggestions using Google Gemini API.
- Uses selected page metadata and analysis results to create focused prompts.
- Sends AI requests through a separate backend service.
- Keeps the Gemini API key on the backend instead of exposing it in the extension.

### 📁 5. Reports & Preferences

- Downloads SEO analysis reports in `.txt` format.
- Stores the last 10 scans using `chrome.storage.local`.
- Supports light and dark themes.

---
## 📸 Screenshots

### Extension Interface
![SEO Analyzer Home](screenshots/01-home.png)

### Technical SEO Analysis
![Technical SEO Analysis](screenshots/02-technical-seo.png)

### SEO Recommendations
![SEO Fixes](screenshots/03-seo-fixes.png)

### AI-Powered Suggestions
![AI Suggestions](screenshots/04-ai-suggestions.png)

## 🔄 How It Works

1. Open a published blog post in Google Chrome.
2. Click the SEO Analyzer extension icon.
3. Select **Analyze This Page**.
4. The extension uses `chrome.scripting.executeScript` to inspect the active webpage.
5. Rule-based checks evaluate on-page and technical SEO factors.
6. The extension calculates the overall SEO score and generates recommendations.
7. Optionally select **Get AI Suggestions** to receive additional recommendations from Google Gemini through the backend service.

**Note:** The standard SEO scan runs locally inside the extension. The optional AI feature communicates with the backend service.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML | Extension popup structure |
| CSS | Styling and light/dark themes |
| Vanilla JavaScript | Analysis logic, scoring, recommendations and UI |
| Chrome Extension Manifest V3 | Browser extension platform |
| Chrome APIs | Scripting, storage and downloads |
| Node.js | Backend runtime |
| Express.js | Backend API |
| Google Gemini API | AI-powered SEO suggestions |
| dotenv | Environment variable configuration |
| express-rate-limit | API request rate limiting |
| Vercel | Backend deployment |

---

## 📂 Project Structure

```text
seo-analyzer-extension/
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── manifest.json
├── popup.css
├── popup.html
├── popup.js
└── README.md
```

---

## 🚀 Installation Guide

### Install the Chrome Extension

1. Clone or download this repository.
2. Open Google Chrome.
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project folder containing `manifest.json`.
7. Open a published blog post.
8. Click the SEO Analyzer extension icon.
9. Select **Analyze This Page**.

### Backend Setup (Optional AI Feature)

The backend is required only for AI-powered suggestions.

**1. Navigate to the backend directory**

```bash
cd backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Create a `.env` file**

Use `.env.example` as a template and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
PORT=3000
```

**4. Start the backend**

```bash
npm start
```

The local health-check endpoint is available at:

```text
http://localhost:3000/
```

**Important:** Keep your `.env` file private. Never commit API keys or other credentials to GitHub.

---

## 🔌 Backend API

### Health Check

```http
GET /
```

Returns a message confirming that the backend API is running.

### Generate AI Suggestions

```http
POST /api/gemini
Content-Type: application/json
```

Example request:

```json
{
  "prompt": "Review these blog SEO results and suggest improvements."
}
```

The backend validates the prompt, applies request rate limiting, communicates with the Gemini API, and returns the generated suggestions.

---

## 🔗 Deployed Backend

The extension uses the following deployed backend endpoint for AI requests:

```text
https://seo-analyser-extension.vercel.app/api/gemini
```

For local development or a different deployment, update the backend endpoint in `popup.js` and configure the corresponding host permission in `manifest.json`.

---

## 🔐 Privacy & Security

- Standard SEO analysis runs locally in the Chrome extension.
- AI suggestions are optional.
- Page information is sent to the backend only when the user requests AI suggestions.
- The Gemini API key is stored as a backend environment variable.
- Backend requests are protected with rate limiting.
- Avoid using AI suggestions on private, confidential, sensitive, or access-controlled pages.

---

## ⚠️ Known Limitations

- Designed specifically for published blog posts rather than general website auditing.
- Non-standard heading structures may affect heading analysis.
- Word-count guidelines may not suit every language or content type.
- Pages without a recognizable article container may fall back to a broader page section.
- SEO scores are rule-based estimates and should not be interpreted as actual search-engine ranking predictions.

---

## 🔮 Future Improvements

- Broken-link detection.
- Readability analysis.
- Sitemap and `robots.txt` checks.
- Multi-page website crawling.
- Competitor SEO comparison.

---

## 🎯 Project Goal

The goal of SEO Analyzer is to make blog SEO analysis easier and more accessible.

Instead of manually checking multiple SEO elements, users can analyze a published blog post, understand potential issues, and receive actionable recommendations directly through their Chrome browser.

---

## 📜 License

This project was developed for educational purposes as a college project.

No license is currently provided for reuse, modification, or redistribution. Please contact the project owner for permission.

---

<p align="center">
  Built with ❤️ for better blog SEO.
  <br/>
  <strong>Analyze • Improve • Optimize</strong>
</p>
