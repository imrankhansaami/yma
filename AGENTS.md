# YMA Bouncy Castles — project guide for agents

Monorepo for the YMA website: a **Next.js 15 frontend** (`frontend/`) and an
**Express + MongoDB API** (`backend/`). Live at https://ymabouncycastles.uk,
API at https://api.ymabouncycastles.uk.

**Read this file before changing anything.** It holds the rules that are not
obvious from the code — invoice and email formats the business requires, the
deploy setup, and traps that have already bitten once.

## Build & deploy

- Hostinger builds **both apps from `main` automatically** on every push.
  Pushing to `main` deploys to production within minutes — for risky changes,
  work on a branch and merge when you're happy.
- Frontend app: root `/`, build `npm run build`, output `frontend/.next`.
- API app: build `npm run build:backend`, entry `backend/dist/server.js`.
- **Never set `PORT`** in the Hostinger API app's environment variables.
- Root scripts: `npm run build:backend`, `npm run build:frontend`,
  `npm run dev` (both via concurrently).

## Local setup

- `backend/.env` and `frontend/.env` are git-ignored and required — recreate
  them from the `.env.example` files if missing. The local backend talks to
  the **live database** and can send **real emails**: avoid test checkouts or
  status changes locally unless that is intended, or point `MONGO_URI` at a
  separate dev database.
- The admin login is **not in this repo** (it lives in `yma.txt` outside it).
  Never commit credentials.
- GitHub pushes from the original Windows machine needed WARP; on macOS that
  was not required.

## Working from more than one machine

The site is developed from two checkouts — the original Windows machine
(OpenChamber) and the user's MacBook (Cursor). Both push to `main`, which
deploys live. So:

- **Pull before you start** (`git pull`) and again right before pushing
  (`git pull --rebase`), so you never fight a push.
- Prefer a **branch + PR** for anything beyond a small fix; merges to `main`
  deploy within minutes.
- One machine at a time on the same area — overlapping edits to the same files
  cause merge conflicts.
- Uncommitted changes and `.env` files do **not** travel between machines;
  each checkout keeps its own. A new env var must be added to both local
  `.env` files and to Hostinger's app settings.
- Decisions and rules belong in this file (or `docs/`) so both machines and
  every agent read the same thing.

## Invoice rules

Single source of truth: `backend/src/app/modules/Order/invoice.renderer.ts`.
`renderInvoice*` feeds **every** surface — email HTML, email PDF attachment,
admin preview, customer download, bulk print. Never duplicate the invoice
markup elsewhere.

- The invoice must show **every choice made at checkout**: Delivery and
  Collection windows, "The product will be" (placement), Used by, Hire
  occasion (through `hireOccasionLabel()` — never the raw machine value),
  Purchase type, customer Notes (boxed, under the booking block), and the
  payment method. Business orders bill the **company first** in the
  "Billed to" block.
- Time windows in fee lines use the hyphen form: `Preferred Delivery Time
  (13-00)`.
- One fee line per **charged** window; amounts are clamped to the stored
  `deliveryFee` so the printed lines always reconcile with the Total.
- Totals block: every row **bold black**, a hairline between rows, a thick
  rule **above and below** the Total, amounts right-aligned, with a little
  air around the Total. A promo discount names its code: `Discount (CODE)`.
- Footer on every invoice: `PAYMENT DETAILS: YMA BOUNCY CASTLES LTD`,
  `SC: 20-25-19`, `AC:60465909`.
- Wording: "The product will be" with a **single colon** (matches the old
  WordPress invoices customers are used to).
- Order #1000 sits at £160 (both paid windows charged) — a deliberate,
  one-off correction; don't "fix" it back.

## Email flow per order

The customer receives **4 emails**, each with the invoice PDF attached:

1. Order confirmation — at checkout (the `orderConfirmed` template).
2. Invoice — at checkout, moments later.
3. Delivery reminder — 09:00 Europe/London, the day before the hire.
4. Thank-you — 10:00 Europe/London, the day after the hire.

Plus, only for first-time customers, one account/credentials email (no
invoice, no admin copy).

The admin (`ADMIN_EMAIL`) receives **exactly one email per order**: the
"🚨 NEW ORDER" alert at checkout, with the invoice PDF attached. Customer
emails are **never** BCC'd to the admin.

- Confirming an order in the dashboard sends **nothing** to the customer; the
  manual "Send invoice" button sends one on demand.
- Cancellation emails the customer only, with no invoice PDF.
- The morning-of reminder (07:00) was retired on request — do not re-add it
  without asking.

## Payments — cash only

Card payments were removed from the business. No customer-facing surface may
mention credit/debit cards or offer card options.

- Confirmation email: "Accepted: Cash Only"; bank-transfer orders get
  "Our team will email the bank details separately" / "Payment is due before
  delivery".
- Day-before reminder: "Payment Method: Cash on Delivery" + "Please have the
  payment ready when our driver arrives." — or "Bank Transfer" + "Payment is
  due before delivery." for bank-transfer orders.
- Bank transfer is offered only for **Business Use (School and Corporate
  event)** orders. The invoice shows "Bank transfer" and the SC/AC footer.
- Two dead templates still contain card wording (`emailTemplates.invoice` in
  `Order/email.service.ts` and an unused `generateInvoiceHtml` in
  `Order/order.service.ts`) — never sent; clean them if ever revived.

## Order numbers

4-digit sequential (first was 1000) via the `counters` collection doc
`{ _id: "orderNumber" }`. When creating **test orders**, delete the order AND
that counter doc afterwards — the next order then resumes from the highest
real order number.

## Gotchas

- The CDN caches HTML for up to an hour; admin content edits can lag that
  long. A redeploy forces it. Product/order pages revalidate on save, but the
  CDN layer may still serve slightly stale copies.
- Storefront product pages render **client-side** (the visible content is in
  the RSC payload, not the static HTML) — verify in a real browser, not by
  fetching the HTML.
- `nodemon` does not watch `.env` — restart the dev server after env changes.
- Live order/email templates live in
  `backend/src/app/modules/Order/email.service.ts`; the Checkout module holds
  legacy duplicates. Check which one a send function actually uses before
  editing.
- For email tests without sending: stub `sendEmail` on the compiled
  `utils/resendEmail.service.js` before requiring the email service, then
  inspect the captured message.

## Docs

- `docs/SEO-head-tags-fix-spec.md` — metadata-in-head fix, implemented and
  verified.
- `docs/SEO-visibility-plan.md` — what's done and what's left for search/AI
  visibility.

## Open items

- Register the Google OAuth callback URL
  (`https://ymabouncycastles.uk/api/v1/auth/google/callback`) in Google Cloud
  Console — the code is fixed; the callback registration is the missing step.
- Wire `GOOGLE_REVIEW_URL` (the thank-you email's review link).
- Google Search Console / Bing verification + sitemap (driven by env vars).
- Google Business Profile + reviews.
- Rotate secrets that have appeared in working trees; review `npm audit`
  (known advisories pending).
- Location pages have ~73% overlapping wording — needs content work.
