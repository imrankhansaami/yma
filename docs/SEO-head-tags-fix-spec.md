# SEO fix spec — metadata rendered outside `<head>`

> **STATUS: IMPLEMENTED AND VERIFIED.** Fixed on the live site (commits `95c8bf2`
> and `72f5ff8`). All 21 page types now serve the title, meta description,
> canonical and robots directive inside `<head>`; the site prerenders 225 pages
> (was ~20). See "What was changed" at the end. Re-run Screaming Frog to confirm
> the four sheets are empty.

Source: Screaming Frog crawl (`Issue to fix dev - YMA.xlsx`), sheets
`canonicals_outside_head`, `directives_outside_head`, `page_titles_outside_head`,
`meta_description_outside_head`.

Reported on: https://ymabouncycastles.uk (Next.js 15 App Router, standalone output,
deployed on Hostinger).

---

## 1. What the report says, in plain language

Screaming Frog found four things on the site:

| Sheet | Meaning |
| --- | --- |
| `page_titles_outside_head` | The `<title>` is in the page body, not in `<head>` |
| `meta_description_outside_head` | The meta description is in the body |
| `canonicals_outside_head` | The `<link rel="canonical">` is in the body |
| `directives_outside_head` | The meta robots (`index, follow` / `noindex, follow`) is in the body |

Google still *often* reads a title or description outside `<head>`, but it is
documented to **ignore a canonical that is not in the head**, and its handling of
an out-of-head robots directive is not something to rely on. This must be fixed.

The spreadsheet lists ~190 URLs, but they are almost all variants of a handful of
page types — see section 3. This is **6 route-level fixes**, not 190 page fixes.

---

## 2. Root cause (verified against the live site)

Next.js writes document metadata into `<head>` only if the metadata has resolved
**before the HTML shell is flushed**. On the affected routes the HTML is rendered
**on demand** and `generateMetadata()` **awaits a network fetch** to the backend
API first, so Next streams the shell, then writes the title/description/canonical/
robots later — into the body.

Evidence (live HTML, November 2026):

* The out-of-head tags appear immediately after a streamed React chunk:
  `...<script>self.__next_f.push([1,"26:\"$22:metadata\"\n"])</script><title>...`
* Page types that are prerendered or served from cache (home, contact, FAQs,
  terms, privacy, `/blog`, `/booking-catalog/<category>`, static landing pages)
  all have their metadata **in `<head>`** — the same metadata API, working.
* Page types rendered on demand have it in the body, on every request.
* One route can show both behaviours depending on the URL/cache state
  (`/locations/cm20` = body; `/locations/bouncy-castles-hire-in-chigwell` = head) —
  which is why the spreadsheet's URL list looks random. **Fix the routes, not the URLs.**

---

## 3. Affected page types (measured on the live site)

| Page type | Route file | Measured now |
| --- | --- | --- |
| Product page | `frontend/src/app/(site)/product/[slug]/page.tsx` | title, description, canonical, robots all in body |
| Blog post | `frontend/src/app/(site)/blog/[slug]/page.tsx` | all in body |
| Booking catalog | `frontend/src/app/(site)/booking-catalog/page.tsx` | all in body |
| Catalog with filters | same file (`?locationName=`, `?category=`, `?search=`…) | all in body |
| Some location pages | `frontend/src/app/(site)/locations/[slug]/page.tsx` | body for on-demand URLs (e.g. `/locations/cm20`, `/locations/rm11`) |
| Core CMS pages | `frontend/src/app/(site)/[slug]/page.tsx` | body for on-demand URLs (e.g. `/about`) — siblings like `/contact`, `/faqs` are fine, same file |

Not affected: home, contact, FAQs, terms, privacy, `/locations`, `/blog`,
`/booking-catalog/<category>`, `/soft-play-hire`, `/garden-games-games-hire`-style
landing pages, cart, checkout, login.

---

## 4. The fix (developer)

Goal: every one of those routes must be **prerendered / served from cache**, so the
metadata is resolved during the render that fills the cache instead of per request.

1. **`product/[slug]/page.tsx`**
   - Remove request-time `searchParams` from the page (line ~137-143). If the page
     only needs them for a client-side filter, read them in the client component
     instead — reading `searchParams` on the server forces a dynamic render on
     every request.
   - Add `export const revalidate = 300;`
   - Add `generateStaticParams()` returning the product slugs
     (`GET /api/v1/products?limit=…` → `slug`), so every product page is generated
     ahead of time.

2. **`blog/[slug]/page.tsx`**
   - Add `generateStaticParams()` returning published blog slugs (the route already
     has `revalidate = 300`).

3. **`booking-catalog/page.tsx`**
   - `/booking-catalog` itself is the indexable page and must be static: stop
     reading `searchParams` in the server component (move filtering/sorting to the
     client component that already exists).
   - The filtered variants are deliberately `noindex, follow` — keep that, and make
     sure it is emitted through the metadata API so it lands in `<head>`.

4. **`locations/[slug]/page.tsx`**
   - Add `generateStaticParams()` for all location slugs **including the postcode
     pages** (`cm20`, `rm11`, …) — those are the ones currently rendered on demand.
     (134 location documents exist.)

5. **`[slug]/page.tsx`** (core CMS pages)
   - Same treatment: `generateStaticParams()` for the known core page keys so
     `/about` and friends are generated ahead of time rather than per request.

6. **Optional cleanup — duplicate robots meta.** Product/blog/location pages emit
   two robots metas (`index, follow` from our metadata plus Next's default
   `index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1`).
   Only set `robots` where it differs from the default — i.e. the `noindex` cases.

Do **not** "fix" this by moving the tags into a client component or by inserting
`<head>` markup by hand: the metadata API is doing the right thing, the routes are
just rendering too late.

---

## 5. Acceptance criteria

After the change and a redeploy, all of these must be true:

```bash
# 1. the title must appear BEFORE </head> on every affected page type
curl -s https://ymabouncycastles.uk/product/popcorn-machine \
  | awk '{ i=index($0,"</head>"); t=index($0,"<title>"); print (t>0 && t<i) ? "OK - title in head" : "FAIL - title outside head" }'

# repeat for:
#   /blog/complete-guide-to-choose-the-perfect-bouncy-castle
#   /booking-catalog
#   /booking-catalog?locationName=Wapping
#   /locations/cm20
#   /about
```

```bash
# 2. the canonical must be in the head as well
curl -s https://ymabouncycastles.uk/booking-catalog | grep -o '<link rel="canonical"[^>]*>'
```

3. Re-run Screaming Frog: the four sheets must come back empty (or contain only
   pages that are deliberately not indexed, such as the admin area).
4. `/booking-catalog?locationName=…` must still be `noindex, follow`, and the
   indexable `/booking-catalog` must still be `index, follow`.

---

## 6. Priority and impact

* **Customer impact: none.** No effect on booking, checkout, payments or the admin.
* **SEO impact:** real but contained. The canonical being out of head is the
  material one — variant URLs (`?locationName=…`, query strings) can be treated as
  separate pages instead of folding into `/booking-catalog`, and the `noindex` on
  the filtered URLs is only respected at Google's discretion.
* Any future SEO audit or agency will raise exactly the same four findings until
  this is fixed, so it is worth closing before an SEO campaign or a Search Console
  review.

---

## 7. What was changed (done)

| Route | Change |
| --- | --- |
| `product/[slug]/page.tsx` | Stopped reading `searchParams` (the availability hints are read in `ProductClient` via a post-mount read of the URL, wrapped in `Suspense`); added `revalidate = 300` and `generateStaticParams()` from the product slugs |
| `blog/[slug]/page.tsx` | Added `generateStaticParams()` from the published posts |
| `locations/[slug]/page.tsx` | Added `generateStaticParams()` for all 116 localities, including the postcode pages (`cm20`, `rm11` …) that were being served on demand |
| `[slug]/page.tsx` | Added `generateStaticParams()` from the public `/api/v1/page-content/type/core` list, excluding the hand-built routes |
| `booking-catalog/page.tsx` | Stopped reading `searchParams`; the client already reads the query string and does all filtering, sorting and paging. Added `revalidate = 300` |
| `booking-catalog/[categorySlug]/page.tsx` | Same, plus `generateStaticParams()` from `CATEGORY_PAGES` |
| `BookingCatalogClient.tsx` | Replaced `useSearchParams()` with a post-mount read of `window.location`. `useSearchParams()` had been making Next render that component on the client only, so the prerendered catalogue HTML was the loading skeleton instead of the product grid |

**Verified:** 225 prerendered pages (was ~20); a live probe of 21 page types shows
title, description, canonical and robots all inside `<head>` (0 affected); the
catalogue HTML is back to 238 kB with 36 server-rendered `/product/` links; cart,
checkout, filters, search, sorting, category pages and 404s all still work.

### Rule for future routes

* **Never read `searchParams`, `cookies()` or `headers()` in a server component if
  the page needs its SEO tags in `<head>`.** Reading them makes the route render on
  demand, and an on-demand render streams the HTML shell before `generateMetadata`
  resolves — the metadata is then written into the body. Read the query string in
  the client component instead.
* A dynamic route (`[slug]`, `[categorySlug]` …) should ship a
  `generateStaticParams()` and a route-level `export const revalidate`, so the page
  is built ahead of time and the metadata is baked into `<head>`.
* A new page type added to the admin will render on demand until it is covered by
  `generateStaticParams` — worth extending the lists when a new content type or
  route is introduced.

### One SEO decision to be aware of

The filtered catalogue URLs (`/booking-catalog?city=Wapping`, `?search=…`) used to
carry a per-query `noindex, follow`. That cannot be done on a static route, so they
are now kept out of the index by the **canonical** to the clean URL instead. That is
the standard approach for faceted navigation, but it is a change of strategy: if
you would rather keep the explicit noindex, the alternative is to keep that route
dynamic and accept the tag placement finding for the filtered URLs only.
