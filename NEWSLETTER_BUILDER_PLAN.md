# Planet Detroit Newsletter Builder - Development Plan

## Project Overview

A dashboard-style web app to replace the WordPress Newspack newsletter tool, streamlining the entire weekly newsletter production process. The tool will generate ActiveCampaign-ready HTML with all sections assembled.

**Live News Curation Tool:** https://news-brief-generator.vercel.app/
**Repository:** https://github.com/Planet-Detroit/news-brief-generator

---

## Newsletter Structure (based on current format)

| Section | Source | Automation Level |
|---------|--------|------------------|
| 1. Header | Static template | Full |
| 2. CO2 Widget | API (NOAA/Scripps) | Full |
| 3. Intro/Editor's Letter | AI-generated from week's content | Semi (human review) |
| 4. P.S. Call-to-Action | Manual or scheduled promos | Manual |
| 5. Featured Promo | WordPress drafts/scheduled | Semi |
| 6. Reporting from Planet Detroit | WordPress API (recent posts) | Full |
| 7. What We're Reading | News Curation Tool output | Full |
| 8. Jobs | WordPress jobs page OR new jobs system | Semi/Full |
| 9. Events | CitySpark API scrape | Semi |
| 10. Support CTA | Static template | Full |
| 11. Ads (NEW) | HTML snippets, toggleable | Manual |
| 12. Footer | Static template | Full |

---

## Phase 1: Foundation & Dashboard (Week 1)

### 1.1 Project Setup
- [ ] Create new Next.js project: `newsletter-builder`
- [ ] Set up Vercel deployment
- [ ] Configure environment variables (WordPress, Gemini, iStock, CitySpark)
- [ ] Install dependencies: Tailwind, date-fns, cheerio, etc.

### 1.2 Dashboard Layout
- [ ] Create main dashboard with section cards
- [ ] Each section shows: status (ready/needs attention/empty), preview, edit button
- [ ] Progress indicator showing which sections are complete
- [ ] "Generate Newsletter" button that assembles all sections

### 1.3 Section State Management
- [ ] Create context/store for newsletter state
- [ ] Persist draft state to localStorage
- [ ] Auto-save functionality

---

## Phase 2: Content Integrations (Week 1-2)

### 2.1 WordPress Integration - "Reporting from Planet Detroit"
- [ ] API endpoint to fetch recent Planet Detroit posts (last 7 days)
- [ ] Display posts with featured image, headline, excerpt
- [ ] Select/deselect which posts to include
- [ ] Drag to reorder
- [ ] Edit excerpt/description if needed

### 2.2 News Curation Integration - "What We're Reading"
- [ ] Option A: Embed existing tool in iframe
- [ ] Option B: Import output from existing tool via copy/paste
- [ ] Option C: Migrate curation panel component into new project
- [ ] Recommendation: **Option B for MVP**, migrate to C later

### 2.3 CO2 Widget
- [ ] Fetch current CO2 from NOAA/Scripps Mauna Loa data
- [ ] Compare to same date last year
- [ ] Link to "What was CO2 when you were born" calculator

---

## Phase 3: AI-Generated Intro (Week 2)

### 3.1 Intro Generation
- [ ] Collect all content for the newsletter (PD stories, curated news, events)
- [ ] Send to Gemini API with prompt to generate 2-3 paragraph intro
- [ ] Prompt should:
  - Identify the top 2-3 themes of the week
  - Write in Nina's voice (conversational, informed, locally-focused)
  - Reference specific stories with bold text for key names/places
  - End with "read on to learn what else caught our attention..."
- [ ] Generate 2-3 variations for editor to choose from
- [ ] Editable text area for final tweaks

### 3.2 Subject Line Generator
- [ ] Generate 3-5 subject line options based on intro
- [ ] Include emoji options (⭐ for featured, relevant emoji for topic)
- [ ] Character count indicator

---

## Phase 4: Events & Jobs (Week 2-3)

### 4.1 CitySpark Events Integration
- [ ] Research CitySpark API or scraping approach
- [ ] Fetch upcoming environmental/community events in Metro Detroit
- [ ] Filter by date range (next 2 weeks)
- [ ] Filter by category (environment, community, outdoor)
- [ ] Select which events to feature (typically 2-3)
- [ ] Add Planet Detroit's own events manually or from WordPress

### 4.2 Jobs Section - Two Options

**Option A: Keep WordPress Plugin (Simpler)**
- [ ] Scrape/fetch from https://planetdetroit.org/jobs-2/
- [ ] Display in dashboard for selection
- [ ] Select 2-3 to feature

**Option B: Build Jobs Management System (Better long-term)**
- [ ] Simple admin interface to add/edit/remove jobs
- [ ] Fields: Organization, Title, URL, Description, Date Posted, Expiration
- [ ] Auto-expire old listings
- [ ] Could replace WordPress plugin entirely
- [ ] API to display on planetdetroit.org/jobs-2/ (future)

**Recommendation:** Start with Option A, build Option B as lower-priority enhancement

---

## Phase 5: Ads & Promos (Week 3)

### 5.1 Ad Management
- [ ] Create "Ad Slots" that can be placed between sections
- [ ] Each ad slot has:
  - Name/label
  - HTML content (pasted from advertiser)
  - Active/inactive toggle
  - Start/end date (optional scheduling)
- [ ] Preset positions: After intro, after PD stories, after What We're Reading, before footer
- [ ] Preview how ads appear in context

### 5.2 Featured Promo Section
- [ ] For special announcements (Neighborhood Reporting Lab, events, campaigns)
- [ ] Image upload or URL
- [ ] Headline, description, CTA button
- [ ] Could pull from WordPress "featured" posts

---

## Phase 6: Assembly & Export (Week 3)

### 6.1 Newsletter Assembly
- [ ] Combine all sections into single HTML document
- [ ] Apply Planet Detroit email template styling
- [ ] Inline CSS for email compatibility
- [ ] Generate both HTML and plain text versions

### 6.2 Preview & Export
- [ ] Full newsletter preview (desktop and mobile views)
- [ ] "Copy HTML" button for ActiveCampaign
- [ ] "Download HTML" option
- [ ] "Send Test Email" (if AC API available)

### 6.3 ActiveCampaign Integration (Future)
- [ ] Research AC API for direct campaign creation
- [ ] Push newsletter directly to AC as draft campaign
- [ ] Track analytics back in dashboard

---

## Technical Architecture

```
newsletter-builder/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main dashboard
│   │   ├── api/
│   │   │   ├── wordpress/
│   │   │   │   └── posts/route.ts   # Fetch PD posts
│   │   │   ├── co2/route.ts         # CO2 data
│   │   │   ├── intro/route.ts       # AI intro generation
│   │   │   ├── cityspark/route.ts   # Events scraping
│   │   │   ├── jobs/route.ts        # Jobs fetching
│   │   │   └── assemble/route.ts    # Final HTML assembly
│   │   └── preview/page.tsx         # Full newsletter preview
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── SectionCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── index.tsx
│   │   ├── Sections/
│   │   │   ├── IntroEditor.tsx
│   │   │   ├── PDStoriesSelector.tsx
│   │   │   ├── CuratedNewsImport.tsx
│   │   │   ├── EventsSelector.tsx
│   │   │   ├── JobsSelector.tsx
│   │   │   ├── AdManager.tsx
│   │   │   └── PromoEditor.tsx
│   │   └── Preview/
│   │       └── NewsletterPreview.tsx
│   ├── lib/
│   │   ├── templates/
│   │   │   └── email-template.ts    # Base HTML template
│   │   └── utils/
│   │       └── inline-css.ts        # CSS inlining for email
│   └── context/
│       └── NewsletterContext.tsx    # State management
```

---

## Environment Variables Needed

```env
# WordPress
WORDPRESS_URL=https://planetdetroit.org
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=

# AI
GEMINI_API_KEY=

# iStock (from existing tool)
ISTOCK_API_KEY=
ISTOCK_API_SECRET=

# CitySpark (TBD)
CITYSPARK_API_KEY=

# ActiveCampaign (future)
ACTIVECAMPAIGN_API_KEY=
ACTIVECAMPAIGN_API_URL=
```

---

## Priority Order

### MVP (Weeks 1-2)
1. Dashboard layout with section cards
2. WordPress posts fetching (Reporting from PD)
3. Import "What We're Reading" from existing tool
4. AI intro generation
5. Basic assembly and HTML export

### Phase 2 (Week 3)
6. Events from CitySpark
7. Jobs fetching from WordPress
8. Ad slot management
9. CO2 widget

### Phase 3 (Future)
10. Jobs management system (replace WP plugin)
11. ActiveCampaign direct integration
12. Analytics dashboard
13. Scheduled/automated newsletter drafts

---

## Questions to Resolve

1. **CitySpark API access** - Do you have API credentials, or will we need to scrape?
2. **ActiveCampaign API** - Do you want direct integration, or is copy/paste HTML sufficient for now?
3. **Jobs automation** - How often do jobs get updated? Is the WordPress plugin working well enough?
4. **Email template** - Do you have the current HTML template from ActiveCampaign we can use as a base?
5. **Authentication** - Should this tool require login, or is it internal-only on a private URL?

---

## Existing Tool Updates (news-brief-generator)

Before starting the new project, complete these minor fixes:

- [x] Add About section with instructions
- [x] Newsletter output includes "Learn more" link to WordPress post
- [ ] ~~Push latest commits to GitHub~~ (blocked by git lock file - do manually)

---

## Next Session Checklist

To continue development in a fresh conversation:

1. Share this plan file
2. Confirm answers to the questions above
3. Decide: Start with new project, or enhance existing tool first?
4. Provide any existing email HTML template from ActiveCampaign
5. Provide CitySpark access details if available

---

## Email to Dustin (Draft)

Subject: New News Curation Tool - Replacing the Desktop App

Hi Dustin,

I've set up a new web-based tool for the weekly news curation: https://news-brief-generator.vercel.app/

**How to use it:**

1. **Paste** — Open the [Planet Detroit News Curator Gem](https://gemini.google.com/gem/1k53wHUaIr5cMHEpNkwaX_GwbNblNEacs) in Gemini, type "run", then paste the output into the tool
2. **Review** — Drag to reorder stories, delete any you don't want, add articles by URL (or paste text for paywalled content)
3. **SEO** — AI generates headline suggestions and meta descriptions. Pick one or customize.
4. **Image** — Search iStock for a featured image. The tool auto-generates alt text and captions.
5. **Publish** — Creates a WordPress draft with everything in one click
6. **Newsletter** — Copy the formatted text for ActiveCampaign (includes a "Learn more" link)

Click the ℹ️ About button in the tool header for these instructions anytime.

**For Brian:** He should continue to suggest stories, but he no longer needs to submit a list of links each week. The Gemini Gem handles the initial curation, and you can add/remove stories as needed in the Review step.

This tool replaces the desktop app I installed previously. I'm working on expanding it into a full newsletter builder that will eventually replace the WordPress Newspack newsletter tool entirely — including auto-generating the intro, pulling in Planet Detroit stories, events from CitySpark, and jobs.

Let me know if you have any questions!

Nina

---

*Plan created: February 5, 2026*
