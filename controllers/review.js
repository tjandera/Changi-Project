/** Step 4 · Review Booking: read-only summary, Terms checkbox, Make Payment (mocked). */
import { api } from '../models/api.js';
import { $ } from '../views/scripts/dom.js';
import { setEnabled, onPress } from '../views/scripts/button.js';
import { ask } from '../views/scripts/dialog.js';
import { checkbox } from '../views/scripts/mui.js';
import { fillSummary, wireSummary } from '../views/scripts/summary.js';
import { viewModel } from '../models/format.js';
import { clear, guard } from '../models/store.js';
import { navigate } from '../models/leave.js';
import { endLoading } from '../views/scripts/loading.js';
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

    // The Terms tick is never stored (not in sessionStorage, not in the booking): it lives here, in
    // memory, and starts empty every time the page is shown, so the guest agrees again each visit.
    let accepted = false;

    const pay = $('[data-action="make-payment"]');
    const terms = checkbox($('[data-field="terms"]'), {
      checked: accepted,
      onChange: (on) => {
        accepted = on;
        setEnabled(pay, on);
      },
    });
    setEnabled(pay, accepted);

    onPress(pay, async () => {
      await api.submitBooking(booking); // mocked: see api.js
      const choice = await ask(config.dialogs.endOfPrototype);
      if (choice === 'secondary') {
        clear();
        navigate(config.routes.landing);
      }
    });

    // Both open in a new tab, as on the live site. Coming back from either (or from any other
    // page, via Back) clears the tick, so the guest agrees again.
    let readingTerms = false;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && readingTerms) {
        readingTerms = false;
        terms.set(false);
      }
    });
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) terms.set(false);
    });
    [
      ['open-terms', config.reviewLinks.terms],
      ['open-privacy', config.reviewLinks.privacy],
    ].forEach(([action, url]) => {
      const el = $(`[data-action="${action}"]`);
      el.setAttribute('role', 'link');
      el.addEventListener('click', () => {
        readingTerms = true;
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    });
  }
  endLoading();
} catch (err) {
  fail(err);
}
