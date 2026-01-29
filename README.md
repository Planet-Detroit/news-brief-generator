# News Brief Generator

A streamlined tool for Planet Detroit that converts article URLs into formatted "What we're reading" news briefs, automatically publishing drafts to WordPress and generating newsletter-ready copy.

## What It Does

1. **Paste URLs** → Click **Generate Brief**
2. **WordPress draft auto-created** with suggested headline and subtitle
3. **Two output tabs**: WordPress (edit your draft) and Newsletter (copy rich text)

## Features

- **One-Click Workflow**: Paste URLs, click generate, done
- **Auto WordPress Publishing**: Creates draft with AI-suggested headline
- **Smart Headlines**: Generates "What we're reading: [Trending Topic]" titles
- **Newsletter Ready**: Copy rich text with "Learn more..." link to your post
- **Paywalled Site Support**: Log in once to Detroit Free Press, Detroit News, Crain's, MLive
- **AI Summarization**: 2-3 sentence summaries with topic emojis
- **iStock Integration**: Suggests relevant stock photos based on content
- **Editable Output**: Tweak summaries, emojis, and kickers before publishing

## Quick Start

### 1. Install Dependencies

```bash
cd news-brief-generator
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required: Anthropic API key for AI summaries
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Required: WordPress credentials for auto-publishing
WORDPRESS_URL=https://planetdetroit.org
WORDPRESS_USERNAME=your-wordpress-username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

**To get a WordPress Application Password:**
1. Log in to WordPress admin
2. Go to Users → Your Profile
3. Scroll to "Application Passwords"
4. Enter a name (e.g., "News Brief Generator") and click "Add New"
5. Copy the generated password (spaces are fine)

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

### Step 1: Log In to Paywalled Sites (First Time Only)

1. Click **Site Logins** tab in the header
2. Click **Login** for each site you subscribe to
3. Log in normally in the browser window that opens
4. Close the window when done—your session is saved

### Step 2: Generate a Brief

1. Paste article URLs (one per line) in the input area
2. Click **Parse URLs** to preview
3. Click **Generate Brief**

### Step 3: Use the Output

**WordPress Tab:**
- Draft is auto-created with suggested headline
- Click **Edit in WordPress** to review and publish
- Use **Find photos on iStock** for featured image ideas

**Newsletter Tab:**
- Click **Copy Rich Text for Newsletter**
- Paste directly into your newsletter editor
- Includes "Learn more..." link to your WordPress post

## Output Format

**WordPress Post:**
```
Title: What we're reading: Polar vortex
Subtitle: Here's some of the news that has caught our eye this week

❄️ **Arctic blast incoming:** Summary text... 📌 Source: PBS News
💧 **Water rates rising:** Summary text... 📌 Source: The Detroit News
```

**Newsletter:**
```
❄️ **Arctic blast incoming:** Summary text... 📌 PBS News

💧 **Water rates rising:** Summary text... 📌 The Detroit News

Learn more...
```

## Installation for Team Members

### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)

### For Dustin (or other staff)

**Step 1: Clone the repository**
```bash
git clone https://github.com/planet-detroit/news-brief-generator.git
cd news-brief-generator
```

**Step 2: Install dependencies**
```bash
npm install
```

**Step 3: Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx    # Ask Nina for the shared API key
WORDPRESS_URL=https://planetdetroit.org
WORDPRESS_USERNAME=your-username   # Your WordPress login
WORDPRESS_APP_PASSWORD=xxxx xxxx   # Generate in WordPress (see below)
```

**Step 4: Create WordPress Application Password**
1. Log into WordPress admin at planetdetroit.org
2. Go to **Users → Profile**
3. Scroll to "Application Passwords"
4. Name it "News Brief Generator" and click **Add New**
5. Copy the password into your `.env.local`

**Step 5: Run the app**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Step 6: Log into paywalled sites (first time only)**
1. Click **Site Logins** in the app
2. Click **Login** for each site you have a subscription to
3. Log in normally in the browser window that opens
4. Sessions are saved locally and persist between restarts

## Supported Paywalled Sites

| Site | Login URL | Network |
|------|-----------|---------|
| Detroit Free Press | freep.com | Gannett |
| Detroit News | detroitnews.com | Gannett |
| Crain's Detroit Business | crainsdetroit.com | Crain's |
| MLive | mlive.com | Advance Local |

Sessions are saved locally in `.sessions/` and persist between restarts.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude API (claude-sonnet-4-20250514)
- **Browser Automation**: Puppeteer (for paywalled sites)
- **CMS**: WordPress REST API with Newspack theme support

## Troubleshooting

### "WordPress credentials not configured"
Check that `WORDPRESS_URL`, `WORDPRESS_USERNAME`, and `WORDPRESS_APP_PASSWORD` are set in `.env.local`

### "WordPress authentication failed"
- Verify your Application Password is correct
- Make sure your WordPress user has Editor or Administrator role
- Check that REST API is enabled on your WordPress site

### "Session expired" for paywalled sites
Click **Site Logins** and log in again. Sessions expire after extended inactivity.

### Subtitle not appearing in WordPress
The Newspack subtitle field requires the meta key to be registered. If it doesn't work automatically, add this to your theme's `functions.php`:

```php
register_post_meta( 'post', 'newspack_post_subtitle', array(
    'show_in_rest' => true,
    'single'       => true,
    'type'         => 'string',
));
```

### Processing is slow
Browser automation takes 5-10 seconds per paywalled article. This is normal.

## File Structure

```
news-brief-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-brief/     # Main brief generation
│   │   │   ├── wordpress/publish/  # WordPress integration
│   │   │   └── suggest-title/      # AI headline generation
│   │   └── page.tsx                # Main UI
│   ├── components/
│   │   ├── BriefOutputPanel.tsx    # Output tabs (WordPress/Newsletter)
│   │   ├── UrlInputPanel.tsx       # URL input
│   │   └── IStockSearch.tsx        # Photo suggestions
│   └── lib/
│       ├── services/
│       │   ├── browser-automation.ts  # Puppeteer/paywalled sites
│       │   ├── summarizer.ts          # Claude API
│       │   └── html-formatter.ts      # Output formatting
│       └── utils/
│           └── url-parser.ts          # Source name detection
├── .env.example
├── .env.local          # Your credentials (git-ignored)
├── .sessions/          # Saved login sessions (git-ignored)
└── README.md
```

## License

Built for Planet Detroit.
