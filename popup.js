// ============================================================
// DOM references — elements from popup.html we'll control
// ============================================================
const analyzeBtn = document.getElementById('analyzeBtn');
const loading = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const errorEl = document.getElementById('errorMsg');
const scoreValueEl = document.getElementById('scoreValue');
const onPageList = document.getElementById('onPageList');
const technicalList = document.getElementById('technicalList');
const recommendationsList = document.getElementById('recommendationsList');
// ============================================================
// Dark / light mode toggle (persisted via chrome.storage.local)
// ============================================================
const themeToggle = document.getElementById('themeToggle');
const downloadBtn = document.getElementById('downloadBtn');
// ============================================================
// SCAN HISTORY - stores last 10 scans in chrome.storage.local
// ============================================================
const MAX_HISTORY = 10;

function saveToHistory(url, score) {
  chrome.storage.local.get(['scanHistory'], (result) => {
    const history = result.scanHistory || [];
    const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

    history.unshift({
      url,
      hostname,
      score,
      date: new Date().toLocaleString()
    });

    const trimmed = history.slice(0, MAX_HISTORY);
    chrome.storage.local.set({ scanHistory: trimmed }, renderHistory);
  });
}

function renderHistory() {
  chrome.storage.local.get(['scanHistory'], (result) => {
    const history = result.scanHistory || [];
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<li class="history-empty">No scans yet.</li>';
      return;
    }

    history.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'history-item';

      let scoreColor = '#b5567f';
      if (entry.score >= 80) scoreColor = '#4a7fb5';
      else if (entry.score >= 50) scoreColor = '#b5728f';

      li.innerHTML = `
        <div class="history-info">
          <span class="history-url">${entry.hostname}</span>
          <span class="history-date">${entry.date}</span>
        </div>
        <span class="history-score" style="background:${scoreColor}">${entry.score}</span>
      `;
      historyList.appendChild(li);
    });
  });
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  chrome.storage.local.set({ scanHistory: [] }, renderHistory);
});

// Render whatever history exists as soon as the popup opens
renderHistory();

// ============================================================
// Build a plain-text report and trigger a file download
// ============================================================
downloadBtn.addEventListener('click', () => {
  if (!window.lastScrapedData || !window.lastChecks) {
    alert('Run "Analyze This Page" first.');
    return;
  }

  const data = window.lastScrapedData;
  const checks = window.lastChecks;
  const score = window.lastScore;
  const recs = buildRecommendations(checks);

  let report = `SEO ANALYSIS REPORT\n`;
  report += `URL: ${data.url}\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Overall Score: ${score}/100\n`;
  report += `\n${'='.repeat(50)}\n\nCHECKS\n${'='.repeat(50)}\n\n`;

  checks.forEach(c => {
    const mark = c.severity === 'pass' ? '[PASS]' : c.severity === 'warning' ? '[WARN]' : '[FAIL]';
    report += `${mark} ${c.label}\n     ${c.detail}\n\n`;
  });

  report += `${'='.repeat(50)}\n\nRECOMMENDATIONS\n${'='.repeat(50)}\n\n`;
  if (recs.length === 0) {
    report += 'No major issues found.\n';
  } else {
    recs.forEach(r => {
      report += `[${r.severity.toUpperCase()}] ${r.label}: ${r.advice}\n\n`;
    });
  }

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const filename = `seo-report-${new Date().toISOString().slice(0, 10)}.txt`;

  chrome.downloads.download({ url, filename, saveAs: true });
});

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
  }
}

// Load saved preference when the popup opens
chrome.storage.local.get(['theme'], (result) => {
  applyTheme(result.theme || 'light');
});

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  chrome.storage.local.set({ theme: newTheme });
});
// ============================================================
// Ripple click effect for buttons (purely visual)
// ============================================================
function addRippleEffect(button) {
  button.addEventListener('click', (e) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

addRippleEffect(analyzeBtn);
addRippleEffect(document.getElementById('aiBtn'));

// ============================================================
// Tab switching (On-Page / Technical / Fixes / AI Suggestions)
// ============================================================
// Create the sliding underline element once
const tabsContainer = document.querySelector('.tabs');
const tabIndicator = document.createElement('div');
tabIndicator.className = 'tab-indicator';
tabsContainer.appendChild(tabIndicator);

function moveTabIndicator(btn) {
  tabIndicator.style.left = btn.offsetLeft + 'px';
  tabIndicator.style.width = btn.offsetWidth + 'px';
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    moveTabIndicator(btn);
  });
});

// Position the indicator under the first tab once the popup opens
window.addEventListener('load', () => {
  const firstTab = document.querySelector('.tab-btn.active');
  if (firstTab) moveTabIndicator(firstTab);
});

// ============================================================
// Main button click — kicks off the whole analysis
// ============================================================
analyzeBtn.addEventListener('click', runAnalysis);

async function runAnalysis() {
  resultsEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  loading.classList.remove('hidden');

  const scanDot = document.getElementById('scanDot');
  const scanUrl = document.getElementById('scanUrl');
  scanDot.classList.add('live');
  scanUrl.textContent = 'scanning...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    scanUrl.textContent = tab.url ? new URL(tab.url).hostname : 'unknown';

    if (!tab.url || tab.url.startsWith('chrome://')) {
      throw new Error("This page can't be analyzed (browser system pages are protected).");
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePage
    });

    const onPageChecks = analyzeOnPage(result);
    const technicalChecks = analyzeTechnical(result);
    const allChecks = [...onPageChecks, ...technicalChecks];

        window.lastScrapedData = result;
        window.lastChecks = allChecks;

    const score = calculateScore(allChecks);
    window.lastScore = score;
    animateScore(score);
    saveToHistory(result.url, score);

    renderChecks(onPageList, onPageChecks);
    renderChecks(technicalList, technicalChecks);

    const recommendations = buildRecommendations(allChecks);
    renderRecommendations(recommendations);

    loading.classList.add('hidden');
    resultsEl.classList.remove('hidden');

  } catch (err) {
    loading.classList.add('hidden');
    errorEl.textContent = err.message || 'Something went wrong.';
    errorEl.classList.remove('hidden');
    scanUrl.textContent = 'error';
  } finally {
    scanDot.classList.remove('live');
  }
}

// ============================================================
// scrapePage() — this is INJECTED into the actual webpage.
// It only sees that page's document/window, nothing from
// the rest of this file.
// ============================================================
function scrapePage() {
  // ---- Find the actual article content, ignoring sidebars/widgets ----
  // Tries common blog-content selectors (works for Blogger, WordPress, etc.)
    const contentSelectors = [
    '[id^="post-body-"]',          // Blogger's actual unique post-body ID (most reliable)
    '[itemprop="articleBody"]',
    '.post-body',
    'article',
    '.entry-content',
    'main'
  ];

  // Instead of taking the FIRST match (which can be a sidebar snippet),
  // check ALL matches across all selectors and keep the one with the
  // most text - the real article will always be the longest block.
  let contentRoot = null;
  let bestLength = 0;

  contentSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const len = (el.innerText || '').trim().length;
      if (len > bestLength) {
        bestLength = len;
        contentRoot = el;
      }
    });
  });

  // Fallback: if nothing usable matched, use the whole body
  if (!contentRoot || bestLength < 50) contentRoot = document.body;

  // ---- On-Page: Title & Meta ----
  const title = document.title || '';
  const metaDescTag = document.querySelector('meta[name="description"]');
  const metaDesc = metaDescTag ? metaDescTag.content : '';
  const metaKeywordsTag = document.querySelector('meta[name="keywords"]');
  const metaKeywords = metaKeywordsTag ? metaKeywordsTag.content : '';

  // ---- On-Page: Headings (scoped to content) ----
  const headingCounts = {};
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
    headingCounts[tag] = contentRoot.querySelectorAll(tag).length;
  });

  // ---- On-Page: Word count & top keywords (scoped to content) ----
    const bodyText = contentRoot.innerText || '';
  // \p{L} matches ANY Unicode letter - English, Hindi/Devanagari, Chinese, etc.
  // The 'u' flag turns on Unicode mode so \p{L} actually works.
    // \p{L} = any letter (English, Hindi, etc.)
  // \p{M} = combining marks (Hindi matras/vowel signs, virama) - needed so
  //         Devanagari words don't get chopped apart at every vowel sign
  const words = bodyText.toLowerCase().match(/[\p{L}\p{M}']+/gu) || [];
  const wordCount = words.length;

  const stopWords = new Set([
    // English stopwords
    'the','a','an','and','or','but','is','are','was','were','to','of','in','on','for','with','this','that','it','as','at','by','be','from','you','your',
    // Common Hindi stopwords
    'है','हैं','का','की','के','को','में','से','पर','यह','और','एक','हो','था','थी','थे','कि','तो','ही','भी','जो','कोई','कुछ','अपने','हुए','हुई'
  ]);
  const freq = {};
  words.forEach(w => {
    if (w.length > 1 && !stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  // ---- On-Page: Images (scoped to content) ----
  const images = Array.from(contentRoot.querySelectorAll('img'));
  const imagesMissingAlt = images.filter(img => !img.alt || img.alt.trim() === '').length;

  // ---- On-Page: Links (scoped to content) ----
  const links = Array.from(contentRoot.querySelectorAll('a[href]'));
  const internalLinks = links.filter(a => {
    try { return new URL(a.href).hostname === window.location.hostname; }
    catch { return false; }
  }).length;
  const externalLinks = links.length - internalLinks;

  // ---- Technical checks stay page-wide (these are meant to check the whole document) ----
  const canonicalTag = document.querySelector('link[rel="canonical"]');
  const hasCanonical = !!canonicalTag;

  const robotsTag = document.querySelector('meta[name="robots"]');
  const robotsContent = robotsTag ? robotsTag.content : '';
  const isNoIndex = robotsContent.toLowerCase().includes('noindex');

  const isHttps = window.location.protocol === 'https:';

  const viewportTag = document.querySelector('meta[name="viewport"]');
  const hasViewport = !!viewportTag;

  const schemaTags = document.querySelectorAll('script[type="application/ld+json"]');
  const hasSchema = schemaTags.length > 0;

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const hasOpenGraph = !!(ogTitle && ogDesc && ogImage);

  return {
    title,
    metaDesc,
    metaKeywords,
    headingCounts,
    wordCount,
    topKeywords,
    totalImages: images.length,
    imagesMissingAlt,
    totalLinks: links.length,
    internalLinks,
    externalLinks,
    hasCanonical,
    isNoIndex,
    isHttps,
    hasViewport,
    hasSchema,
    hasOpenGraph,
    url: window.location.href,
    usedFallbackScope: contentRoot === document.body // useful for debugging
  };
}
// ============================================================
// ON-PAGE SEO CHECKS
// ============================================================
function analyzeOnPage(data) {
  const checks = [];

  checks.push({
    label: 'Title tag',
    severity: !data.title ? 'fail' : (data.title.length >= 50 && data.title.length <= 60 ? 'pass' : 'warning'),
    detail: data.title
      ? `"${data.title}" (${data.title.length} chars, ideal is 50-60)`
      : 'Missing <title> tag entirely'
  });

  checks.push({
    label: 'Meta description',
    severity: !data.metaDesc ? 'fail' : (data.metaDesc.length >= 120 && data.metaDesc.length <= 160 ? 'pass' : 'warning'),
    detail: data.metaDesc
      ? `${data.metaDesc.length} chars (ideal is 120-160)`
      : 'Missing meta description tag'
  });

  checks.push({
    label: 'H1 heading',
    severity: data.headingCounts.h1 === 1 ? 'pass' : (data.headingCounts.h1 === 0 ? 'fail' : 'warning'),
    detail: data.headingCounts.h1 === 0
      ? 'No H1 found - every page needs exactly one'
      : `Found ${data.headingCounts.h1} H1 tag(s) (should be exactly 1)`
  });

  checks.push({
    label: 'Heading structure',
    severity: data.headingCounts.h2 >= 1 ? 'pass' : 'warning',
    detail: `H2: ${data.headingCounts.h2}, H3: ${data.headingCounts.h3}, H4: ${data.headingCounts.h4}`
  });

  checks.push({
    label: 'Word count',
    severity: data.wordCount >= 300 ? 'pass' : (data.wordCount >= 150 ? 'warning' : 'fail'),
    detail: `${data.wordCount} words (blog posts should generally be 300+)`
  });

  checks.push({
    label: 'Top keywords',
    severity: 'pass',
    detail: data.topKeywords.length
      ? data.topKeywords.map(k => `${k.word} (${k.count})`).join(', ')
      : 'No repeated keywords detected'
  });

  checks.push({
    label: 'Image alt text',
    severity: data.totalImages === 0 ? 'pass' : (data.imagesMissingAlt === 0 ? 'pass' : 'fail'),
    detail: data.totalImages === 0
      ? 'No images on this page'
      : `${data.imagesMissingAlt} of ${data.totalImages} images missing alt text`
  });

  checks.push({
    label: 'Internal links',
    severity: data.internalLinks >= 1 ? 'pass' : 'warning',
    detail: `${data.internalLinks} internal, ${data.externalLinks} external link(s)`
  });

  return checks;
}

// ============================================================
// TECHNICAL SEO CHECKS
// ============================================================
function analyzeTechnical(data) {
  const checks = [];

  checks.push({
    label: 'Canonical tag',
    severity: data.hasCanonical ? 'pass' : 'warning',
    detail: data.hasCanonical ? 'Canonical URL is set' : 'No canonical link tag found'
  });

  checks.push({
    label: 'Robots meta tag',
    severity: data.isNoIndex ? 'fail' : 'pass',
    detail: data.isNoIndex
      ? 'Page is set to "noindex" - search engines will skip it!'
      : 'Page is indexable'
  });

  checks.push({
    label: 'HTTPS',
    severity: data.isHttps ? 'pass' : 'fail',
    detail: data.isHttps ? 'Page is served over HTTPS' : 'Page is NOT using HTTPS'
  });

  checks.push({
    label: 'Viewport (mobile-friendly)',
    severity: data.hasViewport ? 'pass' : 'fail',
    detail: data.hasViewport ? 'Viewport meta tag found' : 'Missing viewport tag - page may not be mobile-friendly'
  });

  checks.push({
    label: 'Schema / structured data',
    severity: data.hasSchema ? 'pass' : 'warning',
    detail: data.hasSchema ? 'JSON-LD structured data found' : 'No schema markup detected'
  });

  checks.push({
    label: 'Open Graph tags',
    severity: data.hasOpenGraph ? 'pass' : 'warning',
    detail: data.hasOpenGraph ? 'og:title, og:description, og:image all present' : 'Missing one or more Open Graph tags (affects social share previews)'
  });

  return checks;
}

// ============================================================
// SCORE CALCULATION
// ============================================================
function calculateScore(checks) {
  const points = { pass: 1, warning: 0.5, fail: 0 };
  const total = checks.reduce((sum, c) => sum + points[c.severity], 0);
  return Math.round((total / checks.length) * 100);
}

// ============================================================
// RENDER a list of checks into a <ul>
// ============================================================
function renderChecks(listEl, checks) {
  listEl.innerHTML = '';
  const iconMap = { pass: '✓', warning: '!', fail: '✗' };
  const classMap = { pass: 'icon-pass', warning: 'icon-warning', fail: 'icon-fail' };

  checks.forEach(check => {
    const li = document.createElement('li');
    li.className = 'check-item sev-' + check.severity;
    li.innerHTML = `
      <span class="${classMap[check.severity]}">${iconMap[check.severity]}</span>
      <span class="check-text">
        <strong>${check.label}</strong>
        <span>${check.detail}</span>
      </span>
    `;
    listEl.appendChild(li);
  });
}

// ============================================================
// BUILD RECOMMENDATIONS - plain-English fixes for anything
// that isn't a clean "pass"
// ============================================================
function buildRecommendations(checks) {
  // A little dictionary of friendlier advice per check label,
  // since the raw "detail" text is more diagnostic than actionable.
  const adviceMap = {
    'Title tag': 'Rewrite your title to be 50-60 characters and include your main keyword near the start.',
    'Meta description': 'Write a compelling 120-160 character meta description that summarizes the page and includes your target keyword.',
    'H1 heading': 'Make sure the page has exactly one H1 tag that clearly states the main topic.',
    'Heading structure': 'Break your content into sections using H2 and H3 subheadings - this helps both readers and search engines.',
    'Word count': 'Expand your content. Thin content (under ~300 words) tends to rank poorly for competitive keywords.',
    'Image alt text': 'Add descriptive alt text to every image - it helps accessibility and image search rankings.',
    'Internal links': 'Link to other relevant pages/posts on your own site to help search engines discover your content.',
    'Canonical tag': 'Add a <link rel="canonical"> tag to prevent duplicate-content issues.',
    'Robots meta tag': 'Remove "noindex" from your robots meta tag if you want this page to appear in search results.',
    'HTTPS': 'Move your site to HTTPS - it is a confirmed Google ranking factor and browsers flag HTTP sites as insecure.',
    'Viewport (mobile-friendly)': 'Add a <meta name="viewport" content="width=device-width, initial-scale=1"> tag so the page renders correctly on mobile.',
    'Schema / structured data': 'Add JSON-LD structured data (e.g. Article or BlogPosting schema) so search engines can show rich results.',
    'Open Graph tags': 'Add og:title, og:description, and og:image meta tags so shared links look good on social media.'
  };

  return checks
    .filter(c => c.severity !== 'pass')
    .map(c => ({
      severity: c.severity, // 'warning' or 'fail'
      label: c.label,
      advice: adviceMap[c.label] || 'Review this item and bring it in line with SEO best practices.'
    }));
}

// ============================================================
// RENDER recommendations list
// ============================================================
function renderRecommendations(recommendations) {
  recommendationsList.innerHTML = '';

  if (recommendations.length === 0) {
    recommendationsList.innerHTML = '<li class="rec-item">Nice work - no major issues found!</li>';
    return;
  }

  recommendations.forEach(rec => {
    const li = document.createElement('li');
    li.className = 'rec-item';
    const badgeClass = rec.severity === 'fail' ? 'issue' : 'warning';
    const badgeText = rec.severity === 'fail' ? 'Issue' : 'Warning';
    li.innerHTML = `
      <span class="rec-severity ${badgeClass}">${badgeText}</span>
      <strong>${rec.label}:</strong> ${rec.advice}
    `;
    recommendationsList.appendChild(li);
  });
}

// ============================================================
// AI SUGGESTIONS - calls Google's Gemini API for custom advice
// ============================================================
document.getElementById('aiBtn').addEventListener('click', getAISuggestions);


async function getAISuggestions() {
  const aiLoading = document.getElementById('aiLoading');
  const aiOutput = document.getElementById('aiOutput');
  aiOutput.textContent = '';

  if (!window.lastScrapedData || !window.lastChecks) {
    aiOutput.textContent = 'Click "Analyze This Page" first.';
    return;
  }

  aiLoading.classList.remove('hidden');

  try {
    const prompt = buildAIPrompt(
      window.lastScrapedData,
      window.lastChecks
    );

    const response = await fetch(
      'https://seo-analyser-extension.vercel.app/api/gemini',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI request failed.');
    }

    const text = data.text || 'No suggestions returned.';
    renderAISuggestions(text);

  } catch (err) {
    aiOutput.textContent = 'Error: ' + err.message;
  } finally {
    aiLoading.classList.add('hidden');
  }
}


function buildAIPrompt(data, checks) {
  const failedLabels = checks
    .filter(c => c.severity !== 'pass')
    .map(c => c.label)
    .join(', ') || 'none';

  return `You are an SEO expert reviewing a blog page.

Title: "${data.title}"
Meta description: "${data.metaDesc}"
Word count: ${data.wordCount}
Top keywords found: ${data.topKeywords.map(k => k.word).join(', ') || 'none'}
Headings: H1=${data.headingCounts.h1}, H2=${data.headingCounts.h2}, H3=${data.headingCounts.h3}
Rule-based issues already detected: ${failedLabels}

Give 3-5 specific, actionable SEO improvement suggestions for THIS page (not generic advice). Keep it concise, using short bullet points.`;
}

// ============================================================
// Turn Gemini's markdown-style text into a clean HTML list
// ============================================================
function renderAISuggestions(text) {
  const aiOutput = document.getElementById('aiOutput');

  // Split into individual bullet lines (lines starting with * or -)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const bullets = lines
    .filter(l => l.startsWith('*') || l.startsWith('-'))
    .map(l => l.replace(/^[*-]\s*/, ''));

  // If Gemini didn't use bullet formatting, just show the raw text
  if (bullets.length === 0) {
    aiOutput.textContent = text;
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'ai-suggestion-list';

  bullets.forEach(bullet => {
    // Convert **bold** markdown into real <strong> tags
    const formatted = bullet.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const li = document.createElement('li');
    li.className = 'ai-suggestion-item';
    li.innerHTML = formatted;
    ul.appendChild(li);
  });

  aiOutput.innerHTML = '';
  aiOutput.appendChild(ul);
}

// ============================================================
// Animate the score ring filling in + the number counting up
// ============================================================
function animateScore(targetScore) {
  const ringFill = document.getElementById('scoreRingFill');
  const circumference = 327; // must match the CSS stroke-dasharray value
  
  
  // Color: red under 50, amber 50-79, green 80+
    // Color: soft coral under 50, soft amber 50-79, soft teal 80+
    // Color: soft coral under 50, soft amber 50-79, soft teal 80+
    // Color: soft pink under 50, soft blush 50-79, sky blue 80+
    // Color: soft pink under 50, sky blue 50-79, sky blue 80+
  let color = '#ffafcc';
  if (targetScore >= 50) color = '#a2d2ff';
  ringFill.style.stroke = color;

  const offset = circumference - (circumference * targetScore) / 100;
  ringFill.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    ringFill.style.strokeDashoffset = offset;
  });

  // Count up the number from 0 to targetScore
  let current = 0;
  const duration = 700; // ms
  const stepTime = 16;
  const steps = duration / stepTime;
  const increment = targetScore / steps;

  const counter = setInterval(() => {
    current += increment;
    if (current >= targetScore) {
      current = targetScore;
      clearInterval(counter);
    }
    scoreValueEl.textContent = Math.round(current);
  }, stepTime);
}