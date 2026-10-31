# Controllers

One file per page. A controller connects the **models** (data and state) to the **views** (what the user sees):
it loads data, puts it on the page, reacts to clicks and typing, and decides where to go next.

| Page | URL | Controller |
|---|---|---|
| Landing | `/` | `landing.js` |
| Step 1 · Trip Details | `/booking-details/` | `trip-details.js` |
| Step 2 · Luggage Details | `/booking-baggage/` | `luggage.js` |
| Step 3 · Personal Details | `/booking-contact/` | `personal-details.js` |
| Step 4 · Review Booking | `/booking-review/` | `review.js` |
| Manage Booking | `/manage-booking-pin/` | `manage-booking.js` |
| FAQs | `/faq/` | `faq.js` |
| *(every page)* | | `boot.js`: `startPage()` and `showPageError()` |

## Every controller has the same shape

```js
/**
 * Step 2 · Luggage Details  ·  /booking-baggage/          <- page name and URL
 * HTML: views/pages/booking-baggage/index.html           <- the page this script runs on
 *
 * What this page does:                                    <- read this first
 *   1. ...
 */

// Models: data and state                                  <- imports, always in this order
import { ... } from '../models/...';
// Views: what the user sees
import { ... } from '../views/scripts/...';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

showPage().catch(showPageError);                           <- the page starts here

async function showPage() {                                <- the page's story, top to bottom
  const config = await startPage();                        <- settings + shared header/footer
  const booking = await loadBookingOrGoHome('trip', config);
  ...
}

function helperUsedAbove() { ... }                         <- smaller steps, each with a one-line comment
```

## Naming rules

| Kind of thing | Name it like | Examples |
|---|---|---|
| A button element | `<what>Button` | `nextButton`, `payButton`, `bookNowButton` |
| A field set up by a view | `<what>Field` / `<what>Picker` / `<what>Checkbox` | `emailField`, `hotelPicker`, `termsCheckbox` |
| A function that sets something up | `setUp<Thing>` | `setUpPinBoxes`, `setUpTermsLinks` |
| A function that redraws part of the page | `show<Thing>` | `showLuggage`, `showTrip`, `showChoice` |
| A view helper that builds a field | `create<Thing>` | `createHotelPicker`, `createTextField` |
| A yes/no value | `is…` / `has…` | `isDifferentHotel`, `hasHotelAndDate`, `isTicked` |
| A fixed value from the live site | `UPPER_CASE` | `COUNT_COLOUR`, `EMAIL_PATTERN` |

No one-letter names: `(hotel) => …`, not `(h) => …`.

## Helpers you will see in every controller

| Helper | From | What it does |
|---|---|---|
| `$(selector, inside?)` | `views/scripts/dom.js` | The first element that matches, like `document.querySelector` |
| `$$(selector, inside?)` | `views/scripts/dom.js` | Every element that matches, as an array |
| `fillBindings(element, values)` | `views/scripts/dom.js` | Writes `values["trip.hotel"]` into each `data-bind="trip.hotel"` element |
| `onPress(button, handler)` | `views/scripts/button.js` | Runs `handler` on click or Enter, only while the button is on |
| `setButtonEnabled(button, true/false)` | `views/scripts/button.js` | Turns a pill button on (black) or off (grey) |
| `loadBookingOrGoHome(step, config)` | `models/store.js` | The saved booking, or sends the guest home if an earlier step is missing |
| `saveBooking(booking)` | `models/store.js` | Keeps the booking for the next page (sessionStorage) |
| `buildViewModel(booking, config)` | `models/format.js` | Turns the booking into the text the page shows ("S$ 58.00", "04 Nov 2026") |
| `nextPageUrl(config, 'luggage')` | `models/flow.js` | The URL of the next step, from `models/data/config.json` |
| `navigate(url)` | `models/leave.js` | Goes to another page without the "Leave this page?" warning |

Elements are found by `data-*` attributes (`data-action="next"`, `data-field="email"`), never by CSS class, so
restyling a page cannot break its controller.
