# Changi Off-Airport Check-In · Case-study replica

Front-end replica of the Changi Off-Airport Check-In booking flow, built for the
**EUXUI CAG Intern Challenge 1**. Not affiliated with Changi Airport Group.
**No data leaves the page**: there are no network calls to any backend, and no tracking.

| | |
|---|---|
| Source of truth | `Changi Case-Study.zip` (saved pages + screenshots) and the live site, captured 30 Oct 2026 |
| Figma prototype | https://www.figma.com/proto/6KAACC2C1GxOySmUomqv7V/Untitled?page-id=16%3A40&node-id=19-1582&starting-point-node-id=19%3A1582&scaling=scale-down-width |
| Stack | Static HTML + the site's own compiled Tailwind CSS + ES modules. No build step. |

## Run it

Any static server from the repo root works (pages use root-relative paths like `/icons/…`):

```bash
python3 -m http.server 8080      # then open http://localhost:8080
# or
npx serve .
```

Opening `index.html` by double-click (`file://`) will not work: the pages load `/data/*.json` with `fetch`.

**Jump straight to any step:** add `?preview=1`, e.g. `http://localhost:8080/booking-review/?preview=1`.
That loads the fictional sample booking in `data/booking.sample.json`. Without it, later steps send you
back to the landing page, like the live site.

## Routes

| Route | Screen | Markup source |
|---|---|---|
| `/` | Landing + booking card | Saved page (zip) |
| `/booking-details/` | Step 1 · Trip Details | Saved page (zip) |
| `/booking-baggage/` | Step 2 · Luggage Details | Saved page (zip) |
| `/booking-contact/` | **Step 3 · Personal Details** (the brief's screen) | Live DOM capture* |
| `/booking-review/` | Step 4 · Review Booking | Saved page (zip) |
| `/manage-booking-pin/` | Manage Booking | Live DOM capture |
| `/faq/` | FAQs | Live DOM capture |

\* The zip's `booking-contact.html` was saved after moving on to Step 4, so it holds Step 4's markup.
Step 3 was captured from the live page instead. Details in [docs/PROVENANCE.md](docs/PROVENANCE.md).

## How it is built

```
index.html, booking-*/, faq/, manage-booking-pin/   page skeletons (original markup + data-* hooks)
_next/static/chunks/*.css     the site's compiled Tailwind/global CSS, byte-identical
_next/static/media/           Lato (Google Fonts build) under the filenames the CSS expects
replica/css/mui-runtime.css   MUI styles captured from the live page (injected at runtime there)
replica/css/replica.css       replica-only additions (label, feedback tab, checkbox, 1 layout pin)
replica/js/api.js             DATA ADAPTER: the only file that knows where data comes from
replica/js/store.js           booking state across steps (sessionStorage)
replica/js/format.js          display strings ("31 Oct 2026", "1 item(s)", "29.00")
replica/js/components/        dropdowns, calendar, MUI fields, dialogs, summary, header
replica/js/pages/             one small script per page
data/*.json                   all content: hotels, flights, prices, FAQ, countries, copy
tools/build_pages.py          regenerates the skeletons from the saved pages (provenance)
```

The site's own JavaScript (Next.js/Turbopack bundles, Adobe Launch, Qualtrics, Google Translate)
is **not** included. It is wired to CAG's production booking, payment and analytics services.
`replica/js` re-implements only the UI behaviour.

## For developers connecting a backend

Read **[docs/INTEGRATION.md](docs/INTEGRATION.md)**. In short:

1. Replace the bodies of the functions in `replica/js/api.js` with calls to your endpoints. Keep the return shapes.
2. Everything a page shows is bound through `data-bind`, `data-field`, `data-action` and `data-list` attributes.
   No page code needs to change when data comes from an API.

## Requirement gaps

Things the capture could not supply, and the default used here: **[docs/GAPS.md](docs/GAPS.md)**.

## Fidelity checks (1512 × 982, Chromium)

| Page | Page height vs reference | Notes |
|---|---|---|
| Landing | 2565 / 2565 | How It Works pinned to the screenshot's equal columns (see GAPS #1) |
| Step 2 | 1127 / 1127 | |
| Step 3 | 1079 / 1079 | Reference shows filled fields; layout identical |
| Step 4 | 1575 / 1575 | |

Full click-through (landing → Step 4 → dialogs, FAQ, Manage Booking) passes with zero console
errors and zero requests outside the local server.

## Licences

- Lato: SIL Open Font License (Google Fonts build via @fontsource/lato).
- Flags: `country-flag-icons` (MIT), see `flags/LICENSE`.
- Phone formatting: `libphonenumber-js` (MIT), see `replica/vendor/`.
- Changi / CAG names, logos, illustrations, copy and CSS belong to Changi Airport Group and are used
  here only for this private case study.
