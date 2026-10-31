/**
 * Step 4 · Review Booking  ·  /booking-review/
 * HTML: views/pages/booking-review/index.html
 *
 * What this page does:
 *   1. Sends the guest home if Steps 1 to 3 are not filled in.
 *   2. Shows the whole booking read-only, with the phone number formatted for its country.
 *   3. Turns on "Make Payment" only while the Terms box is ticked. The tick is never saved:
 *      it starts empty on every visit, and clears again after reading the Terms or Privacy Policy.
 *   4. "Make Payment" shows the end-of-replica dialog (payment is not part of this replica).
 *      "Start Over" in that dialog clears the booking and goes home.
 */

// Models: data and state
import { api } from '../models/api.js';
import { clearBooking, loadBookingOrGoHome } from '../models/store.js';
import { buildViewModel } from '../models/format.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $ } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { showDialog } from '../views/scripts/dialog.js';
import { createCheckbox } from '../views/scripts/mui.js';
import { fillSummary, setUpSummaryToggle } from '../views/scripts/summary.js';
import { finishLoading } from '../views/scripts/loading.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const booking = await loadBookingOrGoHome('contact', config);
  if (!booking) {
    finishLoading(); // Steps 1 to 3 are not done, so the guest is being sent home
    return;
  }

  const { countries } = await api.getCountries();
  const phoneDisplay = formatPhone(booking.contact, countries);
  fillSummary(document, buildViewModel(booking, config, { phoneDisplay }));
  setUpSummaryToggle(config);

  const payButton = $('[data-action="make-payment"]');
  const termsCheckbox = createCheckbox($('[data-field="terms"]'), {
    checked: false,
    onChange: (isTicked) => setButtonEnabled(payButton, isTicked),
  });
  setButtonEnabled(payButton, false);

  onPress(payButton, async () => {
    await api.submitBooking(booking); // mocked: see models/api.js
    const choice = await showDialog(config.dialogs.endOfPrototype);
    if (choice === 'secondary') {
      // "Start Over"
      clearBooking();
      navigate(config.routes.landing);
    }
  });

  setUpTermsLinks(config, termsCheckbox);
  finishLoading();
}

/** "+65 9123 4567": the country's dialling code, then the number grouped the way that country writes it. */
function formatPhone(contact, countries) {
  const country = countries.find((c) => c.iso === contact.countryIso);
  const dialCode = country ? country.dialCode : '';
  const phoneLibrary = window.libphonenumber; // loaded by a <script> tag in the page
  const groupedNumber = phoneLibrary
    ? new phoneLibrary.AsYouType(contact.countryIso).input(contact.phone)
    : contact.phone;
  return `${dialCode} ${groupedNumber}`.trim();
}

/**
 * The Terms and Privacy Policy links open in a new tab, as on the live site.
 * Coming back to this tab (or back to this page with the browser's Back button) clears the tick,
 * so the guest agrees again.
 */
function setUpTermsLinks(config, termsCheckbox) {
  let isReadingTerms = false;

  const links = [
    { action: 'open-terms', url: config.reviewLinks.terms },
    { action: 'open-privacy', url: config.reviewLinks.privacy },
  ];
  links.forEach(({ action, url }) => {
    const link = $(`[data-action="${action}"]`);
    link.setAttribute('role', 'link');
    link.addEventListener('click', () => {
      isReadingTerms = true;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  document.addEventListener('visibilitychange', () => {
    const cameBackToThisTab = document.visibilityState === 'visible';
    if (cameBackToThisTab && isReadingTerms) {
      isReadingTerms = false;
      termsCheckbox.set(false);
    }
  });

  window.addEventListener('pageshow', (event) => {
    const cameBackWithBackButton = event.persisted;
    if (cameBackWithBackButton) termsCheckbox.set(false);
  });
}
