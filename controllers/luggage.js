/**
 * Step 2 · Luggage Details  ·  /booking-baggage/
 * HTML: views/pages/booking-baggage/index.html
 *
 * What this page does:
 *   1. Sends the guest home if Step 1 (the trip) is not filled in.
 *   2. Lets the guest add or remove Standard Luggage and Odd-sized Items with the − and + buttons.
 *   3. After every change: updates the row's price, the totals and the Booking Summary, and saves the booking.
 *   4. Opens the "Odd-sized items" explanation.
 *   5. Turns on "Next" once at least one item is added. Pressing it goes to Step 3.
 */

// Models: data and state
import { countLuggageItems, loadBookingOrGoHome, saveBooking } from '../models/store.js';
import { buildViewModel, formatMoney } from '../models/format.js';
import { nextPageUrl } from '../models/flow.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $, $$, fillBindings } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { showOddSizedInfo } from '../views/scripts/dialog.js';
import { fillSummary, setUpSummaryToggle } from '../views/scripts/summary.js';
import { finishLoading } from '../views/scripts/loading.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

// Colours from the live site: a row with no items is grey, a row with items is black.
const COUNT_COLOUR = { empty: 'rgb(171, 171, 171)', filled: 'rgb(18, 18, 18)' };
const PRICE_COLOUR = { empty: 'rgb(153, 153, 153)', filled: 'rgb(18, 18, 18)' };

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const booking = await loadBookingOrGoHome('trip', config);
  if (!booking) {
    finishLoading(); // Step 1 is not done, so the guest is being sent home
    return;
  }

  const nextButton = $('[data-action="next"]');
  const counters = $$('[data-stepper]'); // one per luggage type: "standard" and "oddSized"
  const unitPrice = {
    standard: config.pricing.standardLuggage,
    oddSized: config.pricing.oddSizedItem,
  };
  const maxPerType = config.booking.maxItemsPerType;

  counters.forEach((counter) => {
    const luggageType = counter.dataset.stepper;

    const changeCount = (change) => {
      const newCount = booking.luggage[luggageType] + change;
      booking.luggage[luggageType] = Math.min(maxPerType, Math.max(0, newCount)); // keep it between 0 and the max
      saveBooking(booking);
      showLuggage();
    };

    $('[data-action="decrement"]', counter).addEventListener('click', () => changeCount(-1));
    $('[data-action="increment"]', counter).addEventListener('click', () => changeCount(+1));
  });

  /** Shows every count, row price, total and the summary, and turns Next on or off. */
  function showLuggage() {
    counters.forEach((counter) => {
      const luggageType = counter.dataset.stepper;
      const count = booking.luggage[luggageType];
      showCountAndPrice(counter, count, count * unitPrice[luggageType]);
    });

    const viewModel = buildViewModel(booking, config);
    fillBindings(document, viewModel.values);
    fillSummary(document, viewModel);
    setButtonEnabled(nextButton, countLuggageItems(booking) > 0);
  }

  $('[data-action="open-odd-sized"]').addEventListener('click', showOddSizedInfo);
  setUpSummaryToggle(config);
  showLuggage();

  onPress(nextButton, () => {
    saveBooking(booking);
    navigate(nextPageUrl(config, 'luggage'));
  });

  finishLoading();
}

/** Writes one row's count and price, grey when it is zero. */
function showCountAndPrice(counter, count, price) {
  const countText = $('[data-bind="count"]', counter);
  countText.textContent = count;
  countText.style.color = count ? COUNT_COLOUR.filled : COUNT_COLOUR.empty;

  const row = counter.closest('[data-hook~="luggage-row"]');
  const priceBox = $('[data-component="row-price"]', row);
  $('[data-bind="subtotal"]', priceBox).textContent = formatMoney(price);
  $$('p', priceBox).forEach((priceText) => (priceText.style.color = count ? PRICE_COLOUR.filled : PRICE_COLOUR.empty));
}
