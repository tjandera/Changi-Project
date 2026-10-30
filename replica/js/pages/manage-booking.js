/** Manage Booking: confirmation code + 6-box PIN, Retrieve Booking (mocked). */
import { api } from '../api.js';
import { $, $$ } from '../dom.js';
import { setEnabled, onPress } from '../components/button.js';
import { ask } from '../components/dialog.js';
import { textField } from '../components/mui.js';
import { boot, fail } from './boot.js';

try {
  const config = await boot();
  const retrieve = $('[data-action="retrieve-booking"]');
  const pins = $$('[data-field="pin"]');
  const code = textField($('[data-field="bookingCode"]'), {
    format: (v) => v.toUpperCase(),
    onChange: () => refresh(),
  });

  const pin = () => pins.map((p) => p.value).join('');
  const refresh = () => setEnabled(retrieve, code.isValid() && pin().length === pins.length);

  pins.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.slice(-1).toUpperCase();
      if (box.value && pins[i + 1]) pins[i + 1].focus();
      refresh();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && pins[i - 1]) pins[i - 1].focus();
    });
    box.addEventListener('paste', (e) => {
      const text = (e.clipboardData.getData('text') || '').replace(/\s/g, '').toUpperCase();
      if (!text) return;
      e.preventDefault();
      pins.forEach((p, j) => (p.value = text[j] || ''));
      refresh();
    });
  });

  onPress(retrieve, async () => {
    await api.retrieveBooking({ code: $('[data-field="bookingCode"]').value, pin: pin() }); // mocked
    const choice = await ask(config.dialogs.retrieveNotConnected);
    if (choice === 'secondary') window.location.href = config.routes.faq;
  });
  refresh();
} catch (err) {
  fail(err);
}
