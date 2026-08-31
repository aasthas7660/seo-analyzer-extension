# SEO Analyzer Extension

A Chrome browser extension that analyzes any webpage for on-page SEO factors, right from the popup.

## Features

- 🔍 Analyzes title tags, meta descriptions, and heading structure (H1–H6)
- 🖼️ Checks image alt attributes
- 🔗 Reviews internal/external link structure
- 📊 Highlights common SEO issues at a glance
- ⚡ Lightweight popup UI — no page reload required

## Installation

### From source (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/aasthas7660/seo-analyzer-extension.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the cloned folder
5. The extension icon should now appear in your toolbar

## Setup

This project uses a config file for [describe what config.js is used for, e.g. API keys]:

1. Copy `config.example.js` to `config.js`
2. Fill in your own values in `config.js`
3. `config.js` is gitignored and won't be committed

## Usage

1. Navigate to any webpage
2. Click the extension icon in your toolbar
3. View the SEO analysis in the popup

## Project Structure

```
seo-analyzer-extension/
├── icons/              # Extension icons (16/48/128px)
├── manifest.json       # Extension manifest
├── popup.html          # Popup UI
├── popup.css           # Popup styling
├── popup.js            # Popup logic
├── config.example.js   # Config template
└── config.js           # Your local config (gitignored)
```

## Tech Stack

- JavaScript (Vanilla)
- Chrome Extension Manifest V3

## Screenshots
<img width="472" height="155" alt="image" src="https://github.com/user-attachments/assets/bd22063c-8e6e-457e-ba15-8f3241061f54" />
<img width="471" height="744" alt="image" src="https://github.com/user-attachments/assets/9ecd7757-f6ad-4c18-a55d-6569525ee60f" />



## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.
