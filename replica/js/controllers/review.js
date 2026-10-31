/** Step 4 · Review Booking: read-only summary, Terms checkbox, Make Payment (mocked). */
import { api } from '../models/api.js';
import { $ } from '../views/dom.js';
import { setEnabled, onPress } from '../views/button.js';
import { ask } from '../views/dialog.js';
import { checkbox } from '../views/mui.js';
import { fillSummary, wireSummary } from '../views/summary.js';
import { viewModel } from '../models/format.js';
import { clear, guard, save } from '../models/store.js';
import { navigate } from '../models/leave.js';
import { boot, fail } from './boot.js';

try {
  const config = await boot();
  const booking = await guard('contact', config);
  if (booking) {
    const { countries } = await api.getCountries();
    const country = countries.find((c) => c.iso === booking.contact.countryIso);
    const lib = window.libphonenumber;
    const national = lib ? new lib.AsYouType(booking.contact.countryIso).input(booking.contact.phone) : booking.contact.phone;

    fillSummary(document, viewModel(booking, config, { phoneDisplay: `${country ? country.dialCode : ''} ${national}`.trim() }));
    wireSummary(config);

    const pay = $('[data-action="make-payment"]');
    checkbox($('[data-field="terms"]'), {
      checked: booking.termsAccepted,
      onChange: (on) => {
        booking.termsAccepted = on;
        save(booking);
        setEnabled(pay, on);
      },
    });
    setEnabled(pay, booking.termsAccepted);

    onPress(pay, async () => {
      await api.submitBooking(booking); // mocked: see api.js
      const choice = await ask(config.dialogs.endOfPrototype);
      if (choice === 'secondary') {
        clear();
        navigate(config.routes.landing);
      }
    });

    ['open-terms', 'open-privacy'].forEach((a) =>
      $(`[data-action="${a}"]`).addEventListener('click', () => ask(config.dialogs.notInReplica)),
    );
  }
} catch (err) {
  fail(err);
}
