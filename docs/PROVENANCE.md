# Provenance

Where every part of this repo came from.

## From the zip (`Changi Case-Study.zip`, saved 30 Oct 2026)

| File in zip | Became |
|---|---|
| `Landing Page/Off Airport Check-In.html` | `index.html` |
| `Booking-Review-Details-Changed/Off Airport Booking-Details-Changed.html` | `booking-details/index.html` |
| `Booking Baggage/Off Airport booking baggage.html` | `booking-baggage/index.html`, plus the shared header/footer shell |
| `Booking Review/Off Airport booking-review.html` | `booking-review/index.html` |
| `*_files/0ndgyzgu-3f19.css`, `3vw576cu90qfb.css` | `_next/static/chunks/` (byte-identical) |
| `*_files/*.svg, *.png` | `icons/`, `images/`, `follow-us/` (original URL paths restored) |
| `*/Off Airport *.png` screenshots | Visual references for QA only (not in repo) |

Removed from every saved page: all `<script>` tags and Next.js/Turbopack chunks, Adobe Launch,
Qualtrics, Google Translate, Grammarly styles, and the captured personal data on Step 4.

## Captured from the live site (30 Oct 2026, 1512 × 982 viewport)

The zip had no Step 3 markup and no runtime UI (dropdowns, calendar, dialogs). These were read from the
live DOM with the browser's developer tools, going no further than Step 3 (no booking or payment submitted):

| Capture | Used in |
|---|---|
| Step 3 main content (`/booking-contact`) | `booking-contact/index.html` |
| Hotel dropdown, flight dropdown, react-calendar, country list, tooltips | `replica/js/components/templates.js` |
| "Leave this page?" and "Odd-sized items" dialogs | `templates.js` |
| MUI / emotion runtime CSS | `replica/css/mui-runtime.css` |
| Manage Booking main, FAQ main + all 26 Q&As | `manage-booking-pin/`, `faq/`, `data/faq.json` |
| Hotel list, flight list, tooltip copy, country names | `data/*.json` |
| Icons not in the zip (calendar arrows, dialog icons, collapsed arrow) | `icons/` |
| Skyline banner, FAQ drop-off illustration | `images/*.webp` (re-encoded) |

## Replica code

`replica/js/*`, `replica/css/replica.css`, `data/config.json` structure, `tools/build_pages.py` and `docs/`
are new code written for this case study.
