# Integration guide

The pages are plain HTML skeletons. Scripts in `replica/js` fill them from data and wire the interactions.
To put real data behind them you change **one file**: `replica/js/models/api.js`.

## 1. The data adapter (`replica/js/models/api.js`)

| Function | Today | Replace with (suggested) | Returns |
|---|---|---|---|
| `getConfig()` | `data/config.json` | config endpoint or keep static | see `data/config.json` |
| `getHotels()` | `data/hotels.json` | `GET /hotels` | `[{ id, name }]` |
| `getFlights({ hotelId, date })` | `data/flights.json` (same list every date) | `GET /flights?hotelId=&date=YYYY-MM-DD` | `{ airlines: { SQ: { name, logo } }, flights: [{ flightNumber, airline, route, departureTime }] }` |
| `getCountries()` | `data/countries.json` | keep static | `{ defaultIso, countries: [{ iso, name, dialCode }] }` |
| `getFaq()` | `data/faq.json` | CMS endpoint | `[{ label, items: [{ question, answerHtml }] }]` |
| `submitBooking(booking)` | mocked, returns `{ ok: true, mocked: true }` | `POST /bookings` then redirect to `paymentUrl` | `{ ok, bookingId, paymentUrl }` |
| `retrieveBooking({ code, pin })` | mocked, returns `{ ok: false }` | `POST /bookings/lookup` | `{ ok, booking }` |

`booking` (sent to `submitBooking`) has the shape documented at the top of `replica/js/models/store.js`:

```json
{
  "hotel": { "id": "marina-bay-sands", "name": "Marina Bay Sands" },
  "flightDate": "2026-10-31",
  "flight": { "flightNumber": "SQ836", "airline": "SQ", "route": "Singapore to China (PVG)", "departureTime": "17:00" },
  "luggage": { "standard": 1, "oddSized": 0 },
  "contact": { "firstName": "Alex", "lastName": "Tan", "countryIso": "SG", "phone": "91234567", "email": "alex.tan@example.com" },
  "termsAccepted": true
}
```

Where to hook the real redirect: `replica/js/controllers/review.js`, the `onPress(pay, …)` handler. Today it shows
an "End of replica flow" dialog after `submitBooking`.

## 1b. Code layout (MVC)

| Layer | Folder | Rule |
|---|---|---|
| Model | `replica/js/models/` | Data and state only. No DOM access, except `store.js` redirecting from the step guard. |
| View | `replica/js/views/` | Reads and writes the DOM. Never fetches data or decides the next page. |
| Controller | `replica/js/controllers/` | One per page. Loads models, hands data to views, handles button presses and navigation. |

## 2. Hooks in the HTML

| Attribute | Meaning | Example |
|---|---|---|
| `data-bind="key"` | Text filled from the view model (`models/format.js → viewModel`) | `data-bind="trip.flightSummary"` |
| `data-bind-html="key"` | Inner HTML filled by a component | `data-bind-html="contact.flagSvg"` |
| `data-field="name"` | Input owned by a component | `data-field="email"` |
| `data-action="name"` | Clickable control | `data-action="next"`, `data-action="edit-trip"` |
| `data-nav="name"` | Header link (asks "Leave this page?" during a booking) | `data-nav="faq"` |
| `data-list` + `data-template` | Repeated block; the template is cloned per item | luggage lines, FAQ items |
| `data-stepper="key"` | Luggage counter row | `data-stepper="oddSized"` |
| `data-tooltip="key"` | Info icon; text from `config.tooltips[key]` | `data-tooltip="contactNumber"` |
| `data-component="name"` | Region a script controls | `summary-body`, `booking-card` |

Bound keys (`models/format.js`): `currency`, `trip.hotel`, `trip.flightSummary`, `trip.flightTime`,
`luggage.totalItemsLabel`, `luggage.totalCost`, `contact.fullName`, `contact.phoneDisplay`,
`contact.email`, `contact.dialCode`, and per luggage line `line.label`, `line.subtotal`, `line.itemsLabel`.

To show a new value: add the key to `viewModel()` and put `data-bind="your.key"` on the element.

## 3. Page flow

The order of pages is data, in `data/config.json`:

```json
"flow": { "landing": "luggage", "tripDetails": "luggage", "luggage": "personalDetails", "personalDetails": "review" }
```

Each key is the page the user is on; each value is a key of `routes`. Controllers call
`nextRoute(config, 'landing')` (`models/flow.js`) instead of hard-coding a URL. Today the landing card goes
straight to Step 2 (Luggage). The Step 1 page (`/booking-details/`) is reached from the header "Book Now"
and from the "Edit" links on later steps.

## 4. Changing copy, prices and rules

All in `data/config.json`: currency, prices, booking window, same-day cut-off, max items, step guard,
tooltip text and dialog text. Fields marked `ASSUMED` / `INFERRED` are listed in `docs/GAPS.md`.

## 5. Editing the pages

The HTML pages are the source of truth and are formatted by hand (Prettier, print width 100).
`tools/archive/build_pages.py` is the one-off script that first produced them from the saved pages. It is kept as
history only and must not be re-run over the repo.

## 6. Server

`server.js` (Node, `npm start`) serves the files. It has an empty `routes` table for real endpoints, e.g. `'GET /api/hotels'`.
Point `models/api.js` at those paths and nothing else changes.

## 7. Porting to the production stack

The live site is Next.js + Tailwind + MUI + Redux. The skeletons keep the exact class names, so each page
maps one-to-one onto a React component; `models/api.js` maps onto the existing service layer, and `models/store.js`
onto the booking reducers.
