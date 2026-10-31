/**
 * Manage Booking  ·  /manage-booking-pin/
 * HTML: views/pages/manage-booking-pin/index.html
 *
 * What this page does:
 *   1. Booking Confirmation Code: typed letters become capitals.
 *   2. Booking PIN: six one-character boxes. Typing moves to the next box, Backspace on an empty box moves back,
 *      and pasting a whole PIN fills every box.
 *   3. Turns on "Retrieve Booking" once the code and all six PIN boxes are filled.
 *      Pressing it shows a dialog: looking up a booking needs CAG's booking API, which this replica does not have.
 */

// Models: data and state
import { api } from '../models/api.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $, $$ } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { showDialog } from '../views/scripts/dialog.js';
import { createTextField } from '../views/scripts/mui.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const retrieveButton = $('[data-action="retrieve-booking"]');
  const pinBoxes = $$('[data-field="pin"]');

  const codeField = createTextField($('[data-field="bookingCode"]'), {
    format: (value) => value.toUpperCase(),
    onChange: () => checkForm(),
  });

  /** Turns Retrieve Booking on only when the code is filled in and every PIN box has a character. */
  function checkForm() {
    const pinIsComplete = readPin(pinBoxes).length === pinBoxes.length;
    setButtonEnabled(retrieveButton, codeField.isValid() && pinIsComplete);
  }

  setUpPinBoxes(pinBoxes, { onChange: checkForm });

  onPress(retrieveButton, async () => {
    const bookingCode = $('[data-field="bookingCode"]').value;
    await api.retrieveBooking({ code: bookingCode, pin: readPin(pinBoxes) }); // mocked: see models/api.js
    const choice = await showDialog(config.dialogs.retrieveNotConnected);
    if (choice === 'secondary') navigate(config.routes.faq); // "View FAQs"
  });

  checkForm();
}

/** The PIN typed so far, e.g. "48291" while the last box is still empty. */
function readPin(pinBoxes) {
  return pinBoxes.map((box) => box.value).join('');
}

/** Makes the six boxes behave like one PIN input. */
function setUpPinBoxes(pinBoxes, { onChange }) {
  pinBoxes.forEach((box, index) => {
    const nextBox = pinBoxes[index + 1];
    const previousBox = pinBoxes[index - 1];

    // Keep one capital character per box, then jump to the next box.
    box.addEventListener('input', () => {
      box.value = box.value.slice(-1).toUpperCase();
      if (box.value && nextBox) nextBox.focus();
      onChange();
    });

    // Backspace in an empty box goes back to the previous one.
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !box.value && previousBox) previousBox.focus();
    });

    // Pasting "482915" anywhere fills all six boxes.
    box.addEventListener('paste', (event) => {
      const pastedText = (event.clipboardData.getData('text') || '').replace(/\s/g, '').toUpperCase();
      if (!pastedText) return;
      event.preventDefault();
      pinBoxes.forEach((eachBox, position) => (eachBox.value = pastedText[position] || ''));
      onChange();
    });
  });
}
