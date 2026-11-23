# SEO and AI visibility — what's done and what's left

Site: https://ymabouncycastles.uk (Next.js 15, standalone output, Hostinger)

---

## Done (verified live)

| Item | State |
| --- | --- |
| Page metadata inside `<head>` | Title, description, canonical and robots on all 21 page types (commit `95c8bf2`, `72f5ff8`) |
| 117 legacy WordPress URLs | Now 301-redirect to the right new pages (was 404 — Google was sending traffic to dead ends) |
| Category grid server-rendered | The catalogue's product grid and its internal links are in the HTML again |
| `llms.txt` | Live at https://ymabouncycastles.uk/llms.txt — a quotable fact sheet for AI assistants |
| AI crawlers | Allowed by robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) |
| Search-console tags | The site now emits Google/Bing verification meta tags from env vars — set the code, redeploy, done |
| Structured data | LocalBusiness, Product + Offer, FAQPage, BreadcrumbList, BlogPosting, WebSite |
| Sitemap + robots | 190 URLs, correct domain, clean directives |

## Only you can do these (in this order)

### 1. Google Search Console — 10 minutes
1. https://search.google.com/search-console → **Add property**.
2. Easiest: choose **Domain**, copy the TXT record, add it in
   **hPanel → Domains → DNS / Nameservers → DNS records** (type `TXT`, name `@`).
   This covers www, http/https and subdomains in one go.
   *Alternative:* choose **URL prefix**, copy the `google-site-verification` value,
   set it as `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` on the **frontend** app and
   redeploy — the tag is already wired.
3. **Sitemaps** → submit `sitemap.xml`.
4. Then use **URL Inspection** on the new pages (`/booking-catalog`,
   `/product/popcorn-machine`, a location page) → **Request indexing**. The legacy
   URLs will drop out once Google re-crawls them and sees the 301s.

### 2. Bing Webmaster Tools — 2 minutes
https://www.bing.com/webmasters → **Import from Google Search Console**.
Worth doing because ChatGPT's search and Copilot lean on Bing's index.

### 3. Google Business Profile — the biggest single lever for a local trade
For "bouncy castle hire near me" the map pack takes most of the clicks, and AI
assistants read it too.

- Create/claim the profile at the Loughton address, verify by postcard/video.
- Primary category: **Bouncy castle hire** (secondary: party equipment rental,
  children's party service).
- Service areas: Enfield, Loughton, Chigwell, Ilford, Romford, Walthamstow,
  East London, North London, Essex.
- Services with prices matching the catalogue; opening hours 7 days 8am–7pm
  (must match the site — consistency is a ranking signal).
- 10+ real photos: castles set up, the van, the team, soft play.
- **Reviews are the single highest-value thing you can do this month.** Ask every
  customer the day after the hire; reply to each review. No reviews today = no
  map-pack presence and nothing for AI to cite.
- Post an offer weekly; seed the Q&A with the questions you get asked.

### 4. Third-party mentions (AI assistants cite other sources, not just your site)
Facebook page, Instagram, Yell, FreeIndex, Thomson Local, school and venue
partnerships, local sponsorships. NAP (name, address, phone) must be identical
everywhere: **YMA Bouncy Castles Ltd, 28 Roding Road, Loughton, IG10 3ED,
07951 431111**.

### 5. Content rhythm
One useful post a fortnight: "how much does it cost to hire a bouncy castle in
Enfield", "what size castle fits a small garden", area guides, party checklists.
Each one is another page that can rank and another fact AI can quote. You have
8 posts; 30–40 is where local sites start to dominate.

## Technical backlog (I can do these)

| Item | Why |
| --- | --- |
| **Location pages are 73% identical** (117 of them) | Templated area pages read as doorway pages. Needs genuinely distinct local content — nearby venues, actual postcode coverage, a local photo, a customer line — or the thin ones merged. Biggest remaining technical risk |
| On-site reviews (system exists, 0 reviews) + `AggregateRating` schema | Rich results and AI answers both want ratings |
| FAQ schema on product pages (locations already have it) | Product pages are what people land on from search |
| Internal linking: related products, "also available in…" between areas | Spreads authority to the pages that convert |
| Add the Google Business Profile link to the site footer/contact | Ties the entity together for search and AI |
