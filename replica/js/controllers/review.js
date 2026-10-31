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
import { endLoading } from '../views/loading.js';
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

    // Live: the box is always empty when the page loads, so the guest agrees again after every reload.
    booking.termsAccepted = false;
    save(booking);

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

    // Both open in a new tab, as on the live site.
    [
      ['open-terms', config.reviewLinks.terms],
      ['open-privacy', config.reviewLinks.privacy],
    ].forEach(([action, url]) => {
      const el = $(`[data-action="${action}"]`);
      el.setAttribute('role', 'link');
      el.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer'));
    });
  }
  endLoading();
} catch (err) {
  fail(err);
}
