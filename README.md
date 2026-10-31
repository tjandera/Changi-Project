# Changi Off-Airport Check-In · Case-study replica

![Walkthrough of the replica: landing booking card, Step 2 Luggage, Step 3 Personal Details, Step 4 Review, FAQs, Manage Booking and the 中文 switch](docs/demo.gif)

*Desktop walkthrough at 1280px: choose a hotel, date and flight → add luggage → enter personal details → review and
pay → FAQs → Manage Booking → 中文 and back. Recorded from this repo with `tools/record-demo.js`.*

Front-end replica of the Changi Off-Airport Check-In booking flow, contained Within is just the skeleton and backend for the front-end elements only. Built for developers to integrate their own backend. 

| | |
|---|---|
| Live demo (Vercel) | https://changiproject.vercel.app/ |
| Figma prototype | https://www.figma.com/proto/6KAACC2C1GxOySmUomqv7V/Untitled?page-id=16%3A40&node-id=19-1582&starting-point-node-id=19%3A1582&scaling=scale-down-width |
| Architecture | **Model–View–Controller (MVC)**: `models/`, `views/`, `controllers/`, plus `public/` for static assets |
| Stack | Node server (`scripts/dev-server.js`, no dependencies) + static HTML + the site's own compiled Tailwind CSS + ES modules. |

## Architecture: Model–View–Controller

This project uses a **Model–View–Controller (MVC)** architecture. Every file sits in one of three layers, and each
layer has one job:

| Layer | Folder | Job | Never does |
|---|---|---|---|
| **Model** | `models/` | Data and state: loads hotels, flights, prices and copy (`models/data/*.json`), keeps the booking across steps, decides which page comes next | Touch the page (no DOM) |
| **View** | `views/` | What the user sees: each page's HTML + CSS (`views/pages/`), the shared header/footer (`views/components/`), and the code that draws on the page (`views/scripts/`) | Fetch data or decide what happens next |
| **Controller** | `controllers/` | One script per page: asks the models for data, hands it to the views, reacts to clicks and typing, moves to the next step | Hold data itself or build HTML |
| *(static)* | `public/` | Images, icons, flags, fonts, the live site's compiled CSS and vendor files, served as they are | — |

How a page works, e.g. Step 2 (Luggage):

```
browser opens /booking-baggage/
  └─ views/pages/booking-baggage/index.html + style.css      (View: the markup and its styles)
       └─ controllers/luggage.js                             (Controller: runs on load)
            ├─ models/store.js   → current booking            (Model)
            ├─ models/format.js  → prices and labels to show  (Model)
            ├─ views/scripts/summary.js, button.js → update the page   (View)
            └─ on "Next": models/store.js saves, models/flow.js → /booking-contact/
```

Why it matters for a backend team: only `models/api.js` knows where data comes from, so swapping the JSON files for real
APIs changes one file and no page. Details: [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Run it

You need **Node.js 18 or newer** (check with `node -v`). Get it from https://nodejs.org if you don't have it.
There is nothing to install: the server uses only Node's built-in modules, so there is no `npm install`.

```bash
cd changi-oaci-replica     # the folder that contains package.json
npm start                  # then open http://localhost:3000
```

| Want to | Command |
|---|---|
| Use another port | `PORT=8080 npm start` (Windows PowerShell: `$env:PORT=8080; npm start`) |
| Open it from your phone on the same Wi-Fi | `HOST=0.0.0.0 npm start`, then visit `http://<your-computer-ip>:3000` |
| Restart automatically when `scripts/dev-server.js` changes | `npm run dev` |
| Stop | `Ctrl + C` |

If you see `Port 3000 is already in use`, pick another port as above.

**Jump straight to any step:** add `?preview=1`, e.g. `http://localhost:3000/booking-review/?preview=1`.
That loads the fictional sample booking in `models/data/booking.sample.json`. Without it, later steps send you
back to the landing page, like the live site.

**Edits show on refresh.** HTML, CSS, JS and JSON are served without caching, so change a file and reload.

`scripts/dev-server.js` serves `views/`, `models/` and `controllers/` at their own paths and applies the rewrites in
`vercel.json`, exactly as Vercel does: clean page URLs (`/faq/` → `views/pages/faq/index.html`) and `public/` at the site
root (`/icons/…` → `public/icons/…`). `docs/`, `tools/`, `scripts/` and `.git` return 404. To add a real backend, add
routes to the `routes` table at the top of `scripts/dev-server.js` (see [docs/INTEGRATION.md](docs/INTEGRATION.md)).

Opening a page by double-click (`file://`) will not work, and neither will a plain static server (`npx serve .`): the
pages need those rewrites and load `/models/data/*.json` with `fetch`. Use `npm start`.

## Routes

| Route | Screen | Files (`views/pages/…`) | Markup source |
|---|---|---|---|
| `/` | Landing + booking card | `landing/` | Saved page (zip) |
| `/booking-details/` | Step 1 · Trip Details | `booking-details/` | Saved page (zip) |
| `/booking-baggage/` | Step 2 · Luggage Details | `booking-baggage/` | Saved page (zip) |
| `/booking-contact/` | **Step 3 · Personal Details** (the brief's screen) | `booking-contact/` | Live DOM capture* |
| `/booking-review/` | Step 4 · Review Booking | `booking-review/` | Saved page (zip) |
| `/manage-booking-pin/` | Manage Booking | `manage-booking-pin/` | Live DOM capture |
| `/faq/` | FAQs | `faq/` | Live DOM capture |

**Flow:** the landing card's Book Now goes straight to Step 2 (`/booking-baggage/`). Step 1 is reached from the header
Book Now and from the "Edit" links. The chain is set in `models/data/config.json` under `flow`.

**What is remembered:** the booking lives in `sessionStorage` for the tab. Going back to the landing page or Step 1 and
changing the hotel, date or flight keeps the luggage (Step 2) and personal details (Step 3) already entered; only the
schedule is replaced. The Terms tick on Step 4 is never stored and starts empty every time. "Leave Page" in the
leave dialog clears everything.

\* The zip's `booking-contact.html` was saved after moving on to Step 4, so it holds Step 4's markup.
Step 3 was captured from the live page instead. Details in [docs/PROVENANCE.md](docs/PROVENANCE.md).

## How it is built

The repo follows **MVC**. Models own data and state, views own what the user sees, controllers connect them
(one controller per page). `public/` holds the static files served as they are. There is no build step: plain HTML,
CSS and ES modules.

```
models/                       M · data and state (no DOM)
    api.js                      DATA ADAPTER: the only file that knows where data comes from
    store.js                    booking state across steps (sessionStorage) + step guard
    flow.js                     which page follows which (reads "flow" in data/config.json)
    i18n.js                     language choice and text lookup
    leave.js                    "Leave this page?" skip flag and navigate()
    format.js                   display strings ("31 Oct 2026", "1 item(s)", "29.00") and the view model
    data/*.json                 all content: hotels, flights, prices, FAQ, countries, copy, flow
    data/i18n/*.json            Chinese text for the 中文 button (zh.json, faq.zh.json)

views/                        V · everything the user sees
    pages/<page>/               index.html (that page's markup only) + style.css (styles only it uses)
        landing/  booking-details/  booking-baggage/  booking-contact/  booking-review/  faq/  manage-booking-pin/
    components/                 shared by every page
        header.html, footer.html, language-button.html   the markup, written once
        shared.css                                     their styles + buttons, fields, layout, typography
        include.js                                     puts the .html files into each page's data-include slots
    scripts/                    the code that touches the DOM
        dom.js, templates.js      helpers and the HTML snippets (dropdowns, calendar, dialogs)
        button.js, dialog.js, accordion.js, chrome.js, footer.js, loading.js, summary.js, language.js
        fields.js, mui.js         hotel/date/flight pickers, MUI-style text, phone and checkbox fields

controllers/                  C · one script per page, loaded by that page's <script type="module">
    README.md                   how to read a controller: the shared shape, naming rules, common helpers
    boot.js                     shared start-up (waits for the components, then config, header, tooltips)
    landing, trip-details, luggage, personal-details, review, manage-booking, faq

public/                       static files, served at the site root (/icons/… is public/icons/…)
    _next/static/chunks/*.css   the live site's compiled Tailwind/global CSS, byte-identical (do not edit)
    _next/static/media/         Lato (Google Fonts build) under the filenames that CSS expects
    icons/  images/  flags/  follow-us/  files/   SVG/PNG/WebP assets, country flags, the T&Cs PDF
    vendor/                     mui-runtime.css (MUI styles captured from the live page), libphonenumber-min.js

scripts/dev-server.js         Node server (npm start), no dependencies; applies vercel.json's rewrites
vercel.json                   deployment: clean page URLs → views/pages/…, public/ at the site root
docs/                         INTEGRATION.md, CSS.md, PROVENANCE.md, demo.gif
tools/record-demo.js          records docs/demo.gif (needs Playwright + ffmpeg; see the comment at the top)
tools/archive/build_pages.py  one-off script that produced the first version of the pages (history only)
```

**Each page folder holds two files:** `index.html` (that page's markup only) and `style.css` (styles only that page
uses). Everything shared lives in `views/components/`: the header, footer and 中文 button are written once and each page
marks their place with `<div data-include="header"></div>`; `views/components/include.js` fills those slots before the
page scripts start, and the header slot keeps its 64/68px height so nothing jumps while it loads. CSS naming and rules:
[docs/CSS.md](docs/CSS.md).

The HTML pages are now the **source of truth**. They are hand-formatted, with a header comment on every
page and section labels, so edit them directly.

The site's own JavaScript (Next.js/Turbopack bundles, Adobe Launch, Qualtrics, Google Translate)
is **not** included. It is wired to CAG's production booking, payment and analytics services.
`controllers/`, `models/` and `views/scripts/` re-implement only the UI behaviour.

## For developers connecting a backend

Read **[docs/INTEGRATION.md](docs/INTEGRATION.md)**. In short:

1. Replace the bodies of the functions in `models/api.js` with calls to your endpoints. Keep the return shapes.
2. Everything a page shows is bound through `data-bind`, `data-field`, `data-action` and `data-list` attributes.
   No page code needs to change when data comes from an API.

## Licences

- Lato: SIL Open Font License (Google Fonts build via @fontsource/lato).
- Flags: `country-flag-icons` (MIT), see `public/flags/LICENSE`.
- Phone formatting: `libphonenumber-js` (MIT), see `public/vendor/`.
- Changi / CAG names, logos, illustrations, copy and CSS belong to Changi Airport Group and are used
  here only for this private case study.
