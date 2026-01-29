# News Brief Generator: Next Steps

## Sharing with Your Newsroom

### Option 1: Run Locally (Recommended for Now)

Each team member runs the tool on their own computer. This is the simplest approach and keeps everyone's site logins separate.

**Setup for each person:**

1. Install Node.js (version 18+) from [nodejs.org](https://nodejs.org)
2. Clone or copy the project folder to their computer
3. Open Terminal, navigate to the folder, and run:
   ```bash
   npm install
   cp .env.example .env.local
   ```
4. Edit `.env.local` and add the shared Anthropic API key
5. Run `npm run dev` and open http://localhost:3000
6. Each person logs into paywalled sites using their own subscriptions

**Pros:** Simple, each person uses their own site logins, no server costs
**Cons:** Everyone needs to install Node.js, not accessible from mobile

### Option 2: Shared Internal Server

Run the tool on a shared computer in the newsroom that everyone can access.

1. Set up on a Mac Mini, spare laptop, or office computer
2. Run `npm run dev` (or `npm run build && npm start` for production)
3. Find the computer's IP address (System Preferences → Network)
4. Team members access via `http://[IP-ADDRESS]:3000` on the local network
5. One person logs into paywalled sites, and everyone shares those sessions

**Pros:** One-time setup, shared site logins, accessible from any device on the network
**Cons:** Only works in the office (or via VPN), computer must stay on

### Option 3: Cloud Deployment (Future)

Deploy to Vercel, Railway, or similar. Requires additional work:
- Replace Puppeteer with a serverless-compatible version
- Set up secure session storage (database or encrypted files)
- Configure longer function timeouts
- Handle authentication for the tool itself

This is more complex but would allow access from anywhere.

---

## Planned Improvements

### High Priority

**1. Editable Headlines in Output**
Currently headlines come from the source article. Add the ability to:
- Edit headlines directly in the output panel before copying
- Auto-save edits so they persist if you regenerate

**2. Custom Summary Editing**
- Make summaries inline-editable (click to edit)
- Preserve edits when changing emojis or other fields

**3. Tone/Style Customization**
- Add a "House Style" prompt that gets prepended to all summaries
- Options for different brief formats (newsletter vs. social vs. website)
- Configurable summary length (1 sentence, 2-3 sentences, longer)

### Medium Priority

**4. Save & Load Drafts**
- Save work-in-progress briefs to return to later
- Export/import brief data as JSON

**5. Batch Processing Improvements**
- Progress indicator showing which article is being processed
- Ability to retry failed articles individually
- Reorder articles via drag-and-drop

**6. Additional Site Support**
- Bridge Michigan
- Detroit News (separate from Gannett if needed)
- Other regional outlets as needed

**7. Better Error Messages**
- More specific feedback when article extraction fails
- Suggestions for manual fallback when automation doesn't work

### Lower Priority / Future Ideas

**8. Template System**
- Save multiple output formats (newsletter intro, social post, full brief)
- Custom HTML templates for different use cases

**9. History & Analytics**
- Track which sources are used most often
- Save past briefs for reference

**10. Collaborative Features**
- Multiple people editing the same brief
- Comments/notes on individual articles
- Assignment workflow (who's reviewing what)

---

## Technical Debt & Maintenance

- **Update selectors periodically**: News sites change their HTML structure. If extraction starts failing, the CSS selectors in `browser-automation.ts` and `content-extractor.ts` may need updating.

- **Session expiration**: Site login sessions expire. If fetching starts failing, try logging out and back in via the Site Logins panel.

- **API costs**: Each brief generation uses Claude API tokens. Monitor usage at [console.anthropic.com](https://console.anthropic.com).

---

## Questions to Resolve

1. **Headline policy**: Should the tool suggest headlines at all, or just leave them blank for manual entry?

2. **Summary tone**: What specific style guidelines should be built into the AI prompt? (e.g., active voice, no jargon, specific word limits)

3. **Output format**: Is the current HTML format exactly right for WordPress, or does it need adjustments?

4. **Source attribution**: Current format is `📌 Source: <a href="...">Source Name</a>`. Any changes needed?

---

## Feedback & Issues

As you use the tool, keep notes on:
- Articles that fail to extract properly (save the URLs)
- Summary outputs that need heavy editing (what was wrong?)
- Missing features that would save time
- Confusing parts of the interface

This feedback will guide future improvements.
