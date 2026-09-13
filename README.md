# SEO Analyzer — Chrome Extension

A Chrome extension (Manifest V3) that scans a blog post for on-page and technical SEO issues, scores it out of 100, and generates plain-English fixes plus AI-powered suggestions — all without leaving the page you're reading.

Built as a college project to explore browser extension development, DOM scraping, rule-based scoring systems, and LLM API integration.

---

## Features

**On-Page SEO**
- Title tag length and presence
- Meta description length and presence
- Heading structure (H1 uniqueness, H2/H3 usage)
- Word count
- Top keyword frequency (Unicode-aware — supports English and Hindi/Devanagari)
- Image alt-text coverage
- Internal/external link counts

**Technical SEO**
- Canonical tag
- Robots meta tag (noindex detection)
- HTTPS
- Viewport / mobile-friendliness
- Schema.org structured data (JSON-LD)
- Open Graph tags

**Reporting**
- Weighted 0–100 SEO score with an animated progress ring
- Pass / Warning / Fail severity per check
- Plain-English recommendations tab
- AI-generated, page-specific suggestions (via Google Gemini API)
- Downloadable `.txt` report of the full analysis
- Persistent scan history (last 10 pages analyzed)
- Light and dark themes

---

## Screenshots

**On-Page SEO tab**
![On-Page tab](<Screenshot 2026-09-13 145622.png>)

**Technical SEO tab**
![Technical tab](<Screenshot 2026-09-13 145637.png>)

**Fixes / Recommendations tab**
![Fixes tab](<Screenshot 2026-09-13 145655.png>)

**AI Suggestions tab**
![AI Suggestions tab](<Screenshot 2026-09-13 145714.png>)

**Dark mode**
![Dark mode](<Screenshot 2026-09-13 145759.png>)

---

## Tech Stack

- **JavaScript (vanilla)**, HTML, CSS — no frameworks or build step
- **Chrome Extension Manifest V3** — `chrome.scripting`, `chrome.storage.local`, `chrome.downloads`
- **Google Gemini API** (`gemini-3.6-flash`) for AI-generated suggestions

---

## Project Structure

```
seo-analyzer-extension/
├── manifest.json          # Extension config and permissions
├── popup.html              # Popup UI structure
├── popup.css                # Styling (pastel/neomorphic theme, light + dark mode)
├── popup.js                  # All logic: scraping, scoring, recommendations, AI, history
├── config.js                 # Local-only file holding your real Gemini API key (gitignored)
├── config.example.js         # Safe placeholder template for config.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Setup

1. Clone or download this repository.
2. Copy `config.example.js` to `config.js` and add your own Gemini API key:
   ```javascript
   const AI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```
`config.js` is bundled into the extension and the key is inspectable by anyone who can load it. For local testing, use a restricted, disposable key with the narrowest available quota and permissions. Do not use an unrestricted production key in this client-side extension. Get a free key at [aistudio.google.com](https://aistudio.google.com) — no credit card required.
3. Go to `chrome://extensions` in Chrome.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the `seo-analyzer-extension` folder.
6. Open any blog post, click the extension icon, and click **Analyze This Page**.

---

## Architecture

The extension follows a simple pipeline:

```
scrapePage()          →  reads the DOM (title, meta, headings, images, links, schema, etc.)
      ↓
analyzeOnPage()
analyzeTechnical()    →  applies rule-based checks, assigns pass/warning/fail severity
      ↓
calculateScore()      →  weights all checks into a single 0-100 score
      ↓
buildRecommendations() →  converts non-passing checks into plain-English advice
      ↓
getAISuggestions()    →  sends scraped data + rule results to Gemini for custom advice
```

`scrapePage()` runs *inside* the actual webpage via `chrome.scripting.executeScript`, scoped to the largest matching content container (`article`, `.post-body`, `[itemprop="articleBody"]`, etc.) rather than the whole page, so navigation, sidebars, and widget content don't pollute the results.

### AI Suggestions Privacy

The AI feature is opt-in: after analysis, click **Get AI Suggestions** in the **AI** tab to transmit the scraped page content and rule results to Google Gemini so `getAISuggestions()` can generate custom advice. With a Free Tier key, Google may use prompts and responses to improve its products; Paid Tier data-use terms differ when billing is enabled. See Google's [Gemini API billing documentation](https://ai.google.dev/gemini-api/docs/billing) and [Paid Services terms](https://ai.google.dev/gemini-api/terms#paid-services) for the applicable details. Do not scan private, confidential, sensitive, or access-controlled pages with this feature. To disable AI suggestions, do not click that button; to disable the feature entirely, remove `AI_API_KEY` from `config.js` and reload the extension. Rule-based analysis remains local and does not require the Gemini request.

---

## Notable Challenges & Fixes

A few real bugs surfaced during development and testing, each worth documenting:

1. **Editor/preview pages produce garbage data.** Testing on `draft.blogger.com`'s editor UI (rather than the published post) returned nonsense results, since the editor is a JavaScript app, not the actual blog content. Fix: only analyze live, published URLs.

2. **`querySelector` grabs the first match, not the right one.** Sidebar "Popular Posts" widgets on Blogger sometimes reused the same CSS classes as the real article body, and the first match in the HTML wasn't always the actual post. Fix: check *all* matching elements and keep whichever has the most text — the real article is reliably the longest block.

3. **`[a-z]` regex silently drops non-English text.** The original word-counting regex only matched Latin letters, so Hindi blog posts scored near-zero word counts. Fix: switched to Unicode-aware `\p{L}` (any letter, any script) with the `u` flag.

4. **Devanagari combining marks aren't part of `\p{L}`.** Hindi vowel signs (matras) are a separate Unicode category (`\p{M}`), so words were getting chopped apart mid-word. Fix: matched `[\p{L}\p{M}]+` to keep whole words intact.

---

## Known Limitations

- **API key exposure**: `config.js` keeps the Gemini key out of version control, but since this is a client-side-only extension, the key is technically readable via DevTools by anyone who has the extension loaded. A production version would proxy AI calls through a backend server.
- **Theme-dependent heading detection**: some blog themes (e.g. certain Blogger templates) use `<h3>` for post titles instead of `<h1>`, which the H1 check will always flag — this is a theme convention issue, not a bug.
- **Word-count threshold is English-centric**: the "300+ words" guideline is a general SEO rule of thumb and may not apply equally across languages or content types.
- **Non-article pages**: pages with no detectable article container (e.g. app dashboards, chat interfaces) fall back to scanning the whole page, which can produce misleading results. The extension displays a warning banner in this case.

---

## Future Improvements

- Backend proxy for the AI API key (removes client-side exposure entirely)
- Broken internal link checker (`fetch()` each link, flag 404s)
- Readability scoring (Flesch-Kincaid or similar)
- Sitemap/robots.txt file fetching, not just the on-page robots meta tag
- Multi-page/site-wide crawling and average scoring
- Competitor comparison mode (analyze two URLs side by side)

---

## License

This project was built for educational purposes as part of a college assignment. It is unlicensed: no rights are granted to reuse, modify, or distribute this project. Contact the copyright holder for permission.