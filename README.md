SEO Analyzer — Chrome Extension
Analyze blog-page SEO, understand issues, and get actionable recommendations without leaving the page.

SEO Analyzer is a Chrome extension built with Manifest V3 that checks the on-page and technical SEO elements of a published blog post. It calculates an SEO score out of 100, highlights issues with Pass / Warning / Fail statuses, and provides practical recommendations. An optional AI feature uses Google Gemini to generate additional suggestions.
Features
On-Page SEO Analysis
- Checks the page title and meta description.
- Reviews heading structure, including H1, H2, and H3 usage.
- Counts words in the detected article content.
- Identifies frequently used keywords, with Unicode-aware support for English and Hindi (Devanagari).
- Checks image alt-text coverage.
- Counts internal and external links.
Technical SEO Analysis
- Checks for a canonical URL.
- Detects a noindex robots directive.
- Checks whether the page uses HTTPS.
- Checks for a viewport meta tag.
- Detects Schema.org structured data (JSON-LD).
- Checks Open Graph metadata.
Score & Recommendations
- Calculates a weighted SEO score from 0 to 100.
- Displays Pass, Warning, and Fail results for individual checks.
- Converts failed and warning checks into plain-language recommendations.
AI-Powered Suggestions
- Offers optional, page-specific suggestions using the Google Gemini API.
- Sends a focused prompt containing page metadata and analysis results to the backend.
- Keeps the Gemini API key on the backend rather than in the browser extension.
Reports & Preferences
- Downloads the analysis report as a .txt file.
- Stores the last 10 scans using chrome.storage.local.
- Includes light and dark themes.
How It Works
1. Click Analyze This Page in the extension popup.
2. The extension uses chrome.scripting.executeScript to inspect the active page.
3. It looks for a likely article container, such as article, .post-body, or [itemprop="articleBody"], and uses the best matching content area for analysis.
4. Rule-based checks evaluate on-page and technical SEO factors.
5. The extension calculates the overall score and creates recommendations.
6. If you choose Get AI Suggestions, the extension sends selected page metadata and rule results to the backend, which requests suggestions from Google Gemini.
The standard SEO scan runs locally in the extension. The optional AI request uses the backend service.
Tech Stack
Technology	Usage
HTML	Extension popup structure
CSS	Popup styling and light/dark themes
Vanilla JavaScript	Page analysis, scoring, recommendations, and UI logic
Chrome Extension Manifest V3	Browser extension platform
Chrome APIs	chrome.scripting, chrome.storage, and chrome.downloads
Node.js	Backend runtime
Express	Backend API
Google Gemini API	AI-generated SEO suggestions
dotenv	Backend environment configuration
express-rate-limit	Limits AI endpoint requests
Vercel	Backend deployment


Project Structure
seo-analyzer-extension/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.css
├── popup.html
├── popup.js
└── README.md
Secret files such as backend/.env and local configuration files are intentionally excluded from version control.

Installation: Chrome Extension
1. Clone or download this repository.
2. Open Google Chrome and visit chrome://extensions.
3. Turn on Developer mode.
4. Select Load unpacked.
5. Choose the project folder containing manifest.json.
6. Open a published blog post.
7. Click the SEO Analyzer extension icon and select Analyze This Page.
The extension is designed for published blog content. Results on dashboards, editors, or pages without a detectable article area may be less accurate.
Backend Setup
The backend keeps the Gemini API key outside the extension.
1. Open a terminal in the backend directory.
2. Install the dependencies:
   npm install
3. Create a .env file using .env.example as a template.
4. Add your Gemini API key to .env:
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   PORT=3000
5. Start the backend:
   npm start
The local health-check endpoint is available at http://localhost:3000/.
Using a Different Backend URL
The extension currently sends AI requests to the deployed backend endpoint configured in popup.js:
https://seo-analyser-extension.vercel.app/api/gemini
If you want to use a locally running or separately deployed backend, update the endpoint in popup.js. For local development, also add the local backend origin to host_permissions in manifest.json, then reload the unpacked extension.
Backend API
Health Check
GET /
Returns a message confirming that the API is running.
Generate AI Suggestions
POST /api/gemini
Content-Type: application/json
Example request:
{
  "prompt": "Review these blog SEO results and suggest improvements."
}
The backend validates the prompt, applies request rate limiting, calls the Gemini API, and returns the generated text.
Privacy Notes
- The rule-based SEO scan runs in the extension.
- AI suggestions are optional. Page information is sent to the backend only when Get AI Suggestions is selected.
- The AI prompt is built from selected page information, including the title, meta description, word count, top keywords, heading counts, and detected SEO issues.
- The Gemini API key is stored as a backend environment variable, not in the extension's JavaScript.
- Avoid using the AI feature on private, confidential, sensitive, or access-controlled pages.
Review Google's current Gemini API terms and data-use policies before sending any content to the service.
Known Limitations
- The extension is intended for published blog posts, not general website auditing.
- Some blog themes use non-standard heading structures, which can affect heading checks.
- The word-count guideline is a general SEO reference and may not suit every language or content type.
- Pages without a recognizable article container may fall back to scanning a broader section of the page, which can affect accuracy.
- The SEO score is a rule-based estimate and should be treated as guidance, not a search-engine ranking prediction.
Future Improvements
- Broken-link detection.
- Readability analysis.
- Sitemap and robots.txt checks.
- Multi-page website crawling.
- Competitor SEO comparison.
License
This project was developed for educational purposes as a college project. No license is currently provided for reuse, modification, or redistribution. Please contact the project owner for permission.
<p align="center">
  Made with care for better blog SEO.
</p>
