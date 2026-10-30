/** Step 3 · Personal Details: names, contact number (with country), email. */
import { api } from '../models/api.js';
import { $ } from '../views/dom.js';
import { setEnabled, onPress } from '../views/button.js';
import { phoneField, textField } from '../views/mui.js';
import { fillSummary, wireSummary } from '../views/summary.js';
import { viewModel } from '../models/format.js';
import { guard, save } from '../models/store.js';
import { nextRoute } from '../models/flow.js';
import { boot, fail } from './boot.js';

// ASSUMED: the live rule is not visible in the page; this is a standard address check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

try {
  const config = await boot();
  const booking = await guard('luggage', config);
  if (booking) {
    const { countries } = await api.getCountries();
    const next = $('[data-action="next"]');

    fillSummary(document, viewModel(booking, config));
    wireSummary(config);

    const refresh = () => {
      save(booking);
      setEnabled(next, fields.every((f) => f.isValid()));
    };

    const first = textField($('[data-field="firstName"]'), {
      onChange: (v) => ((booking.contact.firstName = v), refresh()),
    });
    const last = textField($('[data-field="lastName"]'), {
      onChange: (v) => ((booking.contact.lastName = v), refresh()),
    });
    const email = textField($('[data-field="email"]'), {
      validate: (v) => EMAIL.test(v.trim()),
      onChange: (v) => ((booking.contact.email = v.trim()), refresh()),
    });
    const phone = phoneField($('[data-field="phone"]'), {
      countries,
      countryIso: booking.contact.countryIso,
      onChange: ({ countryIso, phone: digits }) => {
        booking.contact.countryIso = countryIso;
        booking.contact.phone = digits;
        refresh();
      },
    });
    const fields = [first, last, phone, email];

    first.set(booking.contact.firstName);
    last.set(booking.contact.lastName);
    email.set(booking.contact.email);
    await phone.setCountry(booking.contact.countryIso);
    phone.set(booking.contact.phone);
    refresh();

    onPress(next, () => {
      save(booking);
      window.location.href = nextRoute(config, 'personalDetails');
    });
  }
} catch (err) {
  fail(err);
}
