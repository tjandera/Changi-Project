# Integration guide

The pages are plain HTML skeletons. Scripts in `controllers/`, `models/` and `views/scripts/` fill them from data and wire the interactions.
To put real data behind them you change **one file**: `models/api.js`.

## 1. The data adapter (`models/api.js`)

| Function | Today | Replace with (suggested) | Returns |
|---|---|---|---|
| `getConfig()` | `models/data/config.json` | config endpoint or keep static | see `models/data/config.json` |
| `getHotels()` | `models/data/hotels.json` | `GET /hotels` | `[{ id, name }]` |
| `getFlights({ hotelId, date })` | `models/data/flights.json` (same list every date) | `GET /flights?hotelId=&date=YYYY-MM-DD` | `{ airlines: { SQ: { name, logo } }, flights: [{ flightNumber, airline, route, departureTime }] }` |
| `getCountries()` | `models/data/countries.json` | keep static | `{ defaultIso, countries: [{ iso, name, dialCode }] }` |
| `getFaq()` | `models/data/faq.json` | CMS endpoint | `[{ label, items: [{ question, answerHtml }] }]` |
| `submitBooking(booking)` | mocked, returns `{ ok: true, mocked: true }` | `POST /bookings` then redirect to `paymentUrl` | `{ ok, bookingId, paymentUrl }` |
| `retrieveBooking({ code, pin })` | mocked, returns `{ ok: false }` | `POST /bookings/lookup` | `{ ok, booking }` |

`booking` (sent to `submitBooking`) has the shape documented at the top of `models/store.js`:

```json
{
  "hotel": { "id": "marina-bay-sands", "name": "Marina Bay Sands" },
  "flightDate": "2026-10-31",
  "flight": { "flightNumber": "SQ836", "airline": "SQ", "route": "Singapore to China (PVG)", "departureTime": "17:00" },
  "luggage": { "standard": 1, "oddSized": 0 },
  "contact": { "firstName": "Alex", "lastName": "Tan", "countryIso": "SG", "phone": "91234567", "email": "alex.tan@example.com" }
}
```

The Terms tick is never stored: it lives in memory on the review page and starts empty every time the page is shown.

Where to hook the real redirect: `controllers/review.js`, the `onPress(pay, …)` handler. Today it shows
an "End of replica flow" dialog after `submitBooking`.

## 1b. Code layout (MVC)

| Layer | Folder | Rule |
|---|---|---|
| Model | `models/` | Data and state only. No DOM access, except `store.js` sending the guest home from a step opened too early (`loadBookingOrGoHome`). |
| View | `views/scripts/` | Reads and writes the DOM. Never fetches data or decides the next page. |
| Controller | `controllers/` | One per page. Loads models, hands data to views, handles button presses and navigation. |

## 2. Hooks in the HTML

| Attribute | Meaning | Example |
|---|---|---|
| `data-bind="key"` | Text filled from the view model (`models/format.js → buildViewModel`) | `data-bind="trip.flightSummary"` |
| `data-bind-html="key"` | Inner HTML filled by a component | `data-bind-html="contact.flagSvg"` |
| `data-field="name"` | Input owned by a component | `data-field="email"` |
| `data-action="name"` | Clickable control | `data-action="next"`, `data-action="edit-trip"` |
| `data-nav="name"` | Header link (navigates straight away, no "Leave this page?") | `data-nav="faq"` |
| `data-list` + `data-template` | Repeated block; the template is cloned per item | luggage lines, FAQ items |
| `data-stepper="key"` | Luggage counter row | `data-stepper="oddSized"` |
| `data-tooltip="key"` | Info icon; text from `config.tooltips[key]` | `data-tooltip="contactNumber"` |
| `data-component="name"` | Region a script controls | `summary-body`, `booking-card` |
| `data-include="name"` | Slot that `views/components/include.js` replaces with `views/components/<name>.html` before any page script runs | `header`, `footer`, `language-button` |
| `data-hook="name"` | Structural element a script looks up with `closest()` (space-separated list). Replaces the Tailwind class selectors the scripts used before the CSS was split, so renaming a class can't break behaviour | `field`, `popup-host`, `tooltip-host`, `luggage-row`, `footer-sites-toggle` |

Bound keys (`models/format.js`): `currency`, `trip.hotel`, `trip.flightSummary`, `trip.flightTime`,
`luggage.totalItemsLabel`, `luggage.totalCost`, `contact.fullName`, `contact.phoneDisplay`,
`contact.email`, `contact.dialCode`, and per luggage line `line.label`, `line.subtotal`, `line.itemsLabel`.

To show a new value: add the key to `buildViewModel()` and put `data-bind="your.key"` on the element.

## 3. Page flow

The order of pages is data, in `models/data/config.json`:

```json
"flow": { "landing": "luggage", "tripDetails": "luggage", "luggage": "personalDetails", "personalDetails": "review" }
```

Each key is the page the user is on; each value is a key of `routes`. Controllers call
`nextPageUrl(config, 'landing')` (`models/flow.js`) instead of hard-coding a URL. Today the landing card goes
straight to Step 2 (Luggage). The Step 1 page (`/booking-details/`) is reached from the header "Book Now"
and from the "Edit" links on later steps.

## 4. Changing copy, prices and rules

All in `models/data/config.json`: currency, prices, booking window, same-day cut-off, max items, step guard,
tooltip text and dialog text. Fields marked `ASSUMED` / `INFERRED` are not confirmed by the live site: check them with the business.

## 5. Editing the pages

The HTML pages are the source of truth and are formatted by hand (Prettier, print width 100).
`tools/archive/build_pages.py` is the one-off script that first produced them from the saved pages. It is kept as
history only and must not be re-run over the repo.

## 5b. Languages (English / 中文)

The 中文 / EN button swaps page text for a dictionary translation. Nothing else changes.

| File | What it holds |
|---|---|
| `models/data/i18n/zh.json` | `strings`: exact English text -> Chinese. `patterns`: text with numbers ("1 item(s)", month names). `inline` and `dateFormat`: dates and "SGT" inside longer text |
| `models/data/i18n/faq.zh.json` | The FAQ in Chinese, same shape as `models/data/faq.json` |
| `models/i18n.js` | Remembers the language and looks text up (no DOM) |
| `models/leave.js` | `navigate(url)`: every in-app page change uses it so the "Leave this page?" checks (tab hidden, browser close/reload) stay quiet |
| `views/scripts/footer.js` | Footer links: opens each URL listed in `models/data/config.json` under `footer` in a new tab, runs the "Changi Sites" dropdown, scrolls to top on the logo |
| `views/scripts/loading.js` | Booking steps: blurred overlay with three bouncing purple dots (live Lottie rebuilt as SVG + CSS). Shows on load of Steps 1-4 and when a link or button moves to one; the page content then fades in as it lifts. Every page also gets the 0.5s fade-and-rise from `replica.css` |
| `views/scripts/language.js` | Swaps text on the page, keeps the English so it can switch back, and translates content the page adds later (dropdowns, dialogs) |

To change a translation, edit the JSON. To translate a new sentence, add its exact English text as a key. Text that is
not in the dictionary stays English. A backend that returns translated content can replace `api.getTranslations()` and
`api.getFaq(lang)` in `models/api.js`. Add `data-i18n="off"` to anything that must never be translated.

## 6. Server

`scripts/dev-server.js` (Node, `npm start`) serves the files. It has an empty `routes` table for real endpoints, e.g. `'GET /api/hotels'`.
Point `models/api.js` at those paths and nothing else changes.

## 7. Porting to the production stack

The live site is Next.js + Tailwind + MUI + Redux. The skeletons keep the exact class names, so each page
maps one-to-one onto a React component; `models/api.js` maps onto the existing service layer, and `models/store.js`
onto the booking reducers.
