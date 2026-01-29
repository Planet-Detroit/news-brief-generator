# Next Steps for News Brief Generator

## Current Status: MVP Complete ✅

The tool now supports the core workflow:
- Paste URLs → Generate Brief → WordPress draft + Newsletter copy

**GitHub Repo**: https://github.com/planet-detroit/news-brief-generator

---

## Future Improvements

### 1. Featured Image Integration (Medium Priority)
**Problem**: User must manually find and set featured image.

**Possible Solutions**:
- Integrate iStock API to search and preview images in-app (requires API access from iStock account rep)
- Auto-suggest images based on article topics
- Allow one-click image selection that uploads to WordPress media library

---

### 2. Category/Tag Auto-Assignment (Medium Priority)
**Problem**: Posts are created without categories or tags.

**Solution**:
- Fetch available categories from WordPress
- AI suggests appropriate categories based on content
- Auto-assign or let user confirm before publishing

---

### 3. Scheduled Publishing (Low Priority)
**Problem**: All posts are created as drafts.

**Solution**:
- Add option to schedule post for specific date/time
- Useful for planning "What we're reading" posts in advance

---

### 4. Additional Paywalled Sites
**Currently Supported**:
- Detroit Free Press
- Detroit News
- Crain's Detroit Business
- MLive

**Easy to Add**: Use the "+ Add Site" button in the Site Logins tab to add any paywalled site with a standard login form.

---

### 5. History/Saved Briefs (Low Priority)
**Problem**: No record of previously generated briefs.

**Solution**:
- Save generated briefs locally
- Allow viewing/editing past briefs

---

## Technical Debt (Completed ✅)

- [x] Remove unused components
- [x] Consolidate duplicate source name mappings
- [x] Add custom site support

---

## Contact

Built by Nina @ Planet Detroit with Claude assistance.
