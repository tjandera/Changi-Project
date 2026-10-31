/**
 * Step 3 · Personal Details  ·  /booking-contact/
 * HTML: views/pages/booking-contact/index.html
 *
 * What this page does:
 *   1. Sends the guest home if Steps 1 and 2 are not filled in.
 *   2. Shows the Booking Summary (trip and luggage).
 *   3. Fills in any details typed before, and saves the booking on every keystroke.
 *   4. Checks each field: names are required, the phone number must be valid for the chosen country,
 *      the email must look like an email. Phone and email turn red when what was typed is wrong.
 *   5. Turns on "Next" once every field is valid. Pressing it goes to Step 4.
 */

// Models: data and state
import { api } from '../models/api.js';
import { loadBookingOrGoHome, saveBooking } from '../models/store.js';
import { buildViewModel } from '../models/format.js';
import { nextPageUrl } from '../models/flow.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $ } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { createPhoneField, createTextField } from '../views/scripts/mui.js';
import { fillSummary, setUpSummaryToggle } from '../views/scripts/summary.js';
import { finishLoading } from '../views/scripts/loading.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

// ASSUMED: the live site's rule is not visible in the page. This is a standard check: text@text.xx
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const booking = await loadBookingOrGoHome('luggage', config);
  if (!booking) {
    finishLoading(); // Steps 1 and 2 are not done, so the guest is being sent home
    return;
  }

  const { countries } = await api.getCountries();
  const nextButton = $('[data-action="next"]');
  const contact = booking.contact; // the part of the booking this page edits

  fillSummary(document, buildViewModel(booking, config));
  setUpSummaryToggle(config);

  // Names are required but never turn red (live behaviour).
  const firstNameField = createTextField($('[data-field="firstName"]'), {
    showErrors: false,
    onChange: (value) => {
      contact.firstName = value;
      saveAndCheck();
    },
  });

  const lastNameField = createTextField($('[data-field="lastName"]'), {
    showErrors: false,
    onChange: (value) => {
      contact.lastName = value;
      saveAndCheck();
    },
  });

  const emailField = createTextField($('[data-field="email"]'), {
    validate: (value) => EMAIL_PATTERN.test(value.trim()),
    onChange: (value) => {
      contact.email = value.trim();
      saveAndCheck();
    },
  });

  const phoneField = createPhoneField($('[data-field="phone"]'), {
    countries,
    countryIso: contact.countryIso,
    onChange: ({ countryIso, phone }) => {
      contact.countryIso = countryIso;
      contact.phone = phone;
      saveAndCheck();
    },
  });

  const allFields = [firstNameField, lastNameField, phoneField, emailField];

  /** Saves what was typed and turns Next on only when every field is valid. */
  function saveAndCheck() {
    saveBooking(booking);
    const everyFieldIsValid = allFields.every((field) => field.isValid());
    setButtonEnabled(nextButton, everyFieldIsValid);
  }

  // Put back anything typed earlier.
  firstNameField.set(contact.firstName);
  lastNameField.set(contact.lastName);
  emailField.set(contact.email);
  // Fill the number in before choosing the country: choosing a country re-reads the number from the field.
  phoneField.set(contact.phone);
  await phoneField.setCountry(contact.countryIso);
  saveAndCheck();

  onPress(nextButton, () => {
    saveBooking(booking);
    navigate(nextPageUrl(config, 'personalDetails'));
  });

  finishLoading();
}
