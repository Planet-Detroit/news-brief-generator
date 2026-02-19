# News Brief Generator — Maintenance Guide

**Last Updated:** February 19, 2026

---

## What This Tool Does

The News Brief Generator creates "What We're Reading" news briefs for Planet Detroit's newsletter. Editors paste article URLs, the tool fetches and summarizes them, and outputs formatted content ready for the newsletter.

**How editors use it:**
1. Paste article URLs (supports paywalled sites: Detroit Free Press, Detroit News, Crain's, MLive)
2. AI generates 2-3 sentence summaries with topic emojis
3. Drag and drop to reorder articles
4. Auto-creates a WordPress draft with suggested headline
5. Outputs newsletter-ready formatted text
6. Can also curate briefs for import into the Newsletter Builder

**Deployment:** Vercel (https://news-brief-generator.vercel.app)

---

## How to Tell If It's Working

1. Visit https://news-brief-generator.vercel.app
2. Log in with the team password
3. Paste a public article URL and click to generate a summary
4. You should see a 2-3 sentence summary appear within a few seconds
5. Try publishing as a WordPress draft — should create a draft post

---

## Running Locally

```bash
cd news-brief-generator

# Install dependencies
npm install

# Create .env.local with required variables (see below)

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

**Note:** Puppeteer (browser automation for paywalled sites) requires Chromium. On first run, it downloads automatically. On Vercel, Puppeteer runs in serverless functions with a headless Chrome layer.

### Required Environment Variables

| Variable | What It Is | Where to Get It |
|----------|-----------|-----------------|
| `GEMINI_API_KEY` | Google Generative AI key | Google AI Studio |
| `WORDPRESS_URL` | WordPress site URL | `https://planetdetroit.org` |
| `WORDPRESS_USERNAME` | WordPress user | WP admin |
| `WORDPRESS_APP_PASSWORD` | WordPress application password | WP > Users > Application Passwords |

**Optional:** The tool also uses Anthropic Claude (via `@anthropic-ai/sdk`) as an alternative summarizer. If `ANTHROPIC_API_KEY` is set, Claude-powered summarization is available alongside Gemini.

---

## Common Problems

### "Article fetch fails / timeout"
- Paywalled sites use Puppeteer browser automation, which can be slow
- Check if the target site changed its login flow or paywall structure
- For non-paywalled sites, the tool uses Cheerio (fast HTML parsing) — if this fails, the site structure may have changed
- Vercel serverless functions have a 10-second timeout (free tier) or 60-second (Pro) — paywalled sites may need Pro

### "Summaries are low quality"
- The tool uses Gemini by default, Claude as alternative
- Check which model is being used (API route in use: `/api/summarize` for Claude, `/api/summarize-gemini` for Gemini)
- If one model produces poor results, try the other

### "WordPress draft creation fails"
- Verify `WORDPRESS_URL`, `WORDPRESS_USERNAME`, and `WORDPRESS_APP_PASSWORD`
- Application passwords are different from login passwords
- Check that the WordPress user has "Editor" or "Author" role (needs post creation permission)

### "iStock image search not working"
- The image proxy now restricts to Getty/iStock domains only (security fix)
- Check that the iStock API credentials are configured if required

### "Build fails after upgrade"
- The project was recently upgraded from Next.js 14 to 15. Some ESLint rules were downgraded to warnings (`no-explicit-any`, `no-unescaped-entities`, `set-state-in-effect`)
- If new lint errors appear, check `eslint.config.mjs` for rule overrides
- Run `npm run lint` to check before deploying

---

## Key API Routes

| Route | Purpose |
|-------|---------|
| `/api/summarize` | Claude-powered article summarization |
| `/api/summarize-gemini` | Gemini-powered summarization |
| `/api/generate-brief` | Full brief generation |
| `/api/suggest-title` | AI title suggestions |
| `/api/fetch-article` | Article content extraction (Cheerio + Puppeteer) |
| `/api/wordpress/publish` | Create WordPress draft |
| `/api/istock/proxy-image` | Image proxy (restricted to Getty/iStock domains) |
| `/api/curate` | Curate articles for newsletter import |

---

## Security Notes

- Image proxy is restricted to an allowlist of Getty/iStock domains (prevents SSRF)
- URL validation checks protocol and hostname before fetching
- No `Access-Control-Allow-Origin: *` on proxy endpoints

---

## Dependencies

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Hosting + serverless functions | Free tier (Pro recommended for Puppeteer timeouts) |
| **Google Generative AI (Gemini)** | Article summarization | Pay-per-use |
| **Anthropic (Claude)** | Alternative summarization | Pay-per-use |
| **WordPress** | Draft creation via REST API | Existing site |
| **Puppeteer/Chromium** | Browser automation for paywalled sites | Bundled (no external cost) |
