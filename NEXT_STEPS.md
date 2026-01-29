# Next Steps for News Brief Generator

## Current Status: MVP Complete ✅

The tool now supports the core workflow:
- Paste URLs → Generate Brief → WordPress draft + Newsletter copy

---

## Priority Improvements

### 1. Cloud Deployment (High Priority)
**Problem**: Currently requires local installation on each person's computer.

**Solutions**:
- **Option A: Shared Server** - Deploy to a VPS (DigitalOcean, Linode) that the team accesses via web browser
- **Option B: Vercel + Browserless** - Use a cloud browser service for Puppeteer
- **Option C: Docker Container** - Package everything for easy deployment anywhere

**Effort**: Medium (1-2 days)

---

### 2. Newspack Subtitle Field Fix (High Priority)
**Problem**: Subtitle may not populate automatically in Newspack.

**Solution**:
- Confirm the exact meta key Newspack uses
- May need to add PHP snippet to `functions.php` to expose field to REST API
- Test with your WordPress setup

**Effort**: Low (1-2 hours once we confirm the field name)

---

### 3. Featured Image Auto-Selection (Medium Priority)
**Problem**: User must manually find and set featured image.

**Possible Solutions**:
- Integrate iStock API to search and preview images in-app
- Auto-suggest images based on article topics
- Allow one-click image selection that uploads to WordPress media library

**Effort**: Medium-High (depends on iStock API access)

---

### 4. Category/Tag Auto-Assignment (Medium Priority)
**Problem**: Posts are created without categories or tags.

**Solution**:
- Fetch available categories from WordPress
- AI suggests appropriate categories based on content
- Auto-assign or let user confirm before publishing

**Effort**: Low-Medium (half day)

---

### 5. Scheduled Publishing (Low Priority)
**Problem**: All posts are created as drafts.

**Solution**:
- Add option to schedule post for specific date/time
- Useful for planning "What we're reading" posts in advance

**Effort**: Low (few hours)

---

### 6. History/Saved Briefs (Low Priority)
**Problem**: No record of previously generated briefs.

**Solution**:
- Save generated briefs locally or to database
- Allow viewing/editing past briefs
- Re-publish updated versions

**Effort**: Medium (half day)

---

### 7. Additional Paywalled Sites (As Needed)
**Currently Supported**:
- Detroit Free Press
- Detroit News
- Crain's Detroit Business
- MLive

**Easy to Add**:
- Any site with standard login form
- Just need: login URL, success indicator CSS selector, content selectors

**To Add a New Site**: Edit `src/lib/services/browser-automation.ts` and add to `SITE_CONFIGS`

---

### 8. Better Error Handling (Low Priority)
**Improvements**:
- More specific error messages for different failure modes
- Retry logic for transient failures
- Better feedback when Claude API is slow/unavailable

---

### 9. Tone/Style Customization (Future)
**Problem**: Summary style is fixed.

**Solution**:
- Allow different summary styles (formal, casual, detailed, brief)
- Custom prompts per publication
- Save style preferences

---

### 10. Analytics Integration (Future)
**Original Idea**: Use Google Analytics to suggest headlines based on what's trending.

**Implementation**:
- Connect to GA4 API
- Analyze which topics/keywords drive traffic
- Incorporate trending topics into headline suggestions

**Effort**: High (requires GA API setup, data analysis logic)

---

## Technical Debt

### Code Cleanup
- [ ] Remove unused `HeadlineSuggestions` component (no longer used)
- [ ] Consolidate duplicate `SOURCE_NAME_FIXES` maps into single location
- [ ] Add proper TypeScript types for all API responses

### Testing
- [ ] Add unit tests for URL parsing
- [ ] Add integration tests for WordPress publishing
- [ ] Test with various article structures

### Performance
- [ ] Parallel article fetching (currently sequential)
- [ ] Cache fetched articles to avoid re-fetching on retry
- [ ] Optimize Claude API calls (batch where possible)

---

## Deployment Checklist for Dustin

1. [ ] Copy project folder to Dustin's computer
2. [ ] Run `npm install`
3. [ ] Create `.env.local` with:
   - Anthropic API key (can share yours)
   - WordPress credentials (his own or shared bot account)
4. [ ] Run `npm run dev`
5. [ ] Log in to paywalled sites via Site Logins tab
6. [ ] Test full workflow with a few URLs

---

## Questions to Resolve

1. **WordPress User Strategy**: Shared "bot" account or individual logins?
2. **Newspack Subtitle**: Need to verify exact meta key - can you check in WP admin?
3. **iStock Integration**: Do you have API access, or just web login?
4. **Cloud Deployment**: Is shared server access acceptable, or does each person need their own?

---

## Contact

Built by Nina @ Planet Detroit with Claude assistance.
