/**
 * The site's pill buttons (Next, Book Now, Make Payment, Retrieve Booking) are <div class="btn-pill">s.
 * Enabled = btn-pill--dark, disabled = btn-pill--disabled (views/components/shared.css), plus the label colour.
 * Each modifier holds the exact three rules the live site toggles (bg, border colour, cursor).
 */
import { pressable } from './dom.js';

const ENABLED = ['btn-pill--dark'];
const DISABLED = ['btn-pill--disabled'];
const TEXT_ON = 'rgb(255, 255, 255)';
const TEXT_OFF = 'rgb(153, 153, 153)';

export function setEnabled(button, enabled) {
  if (!button) return;
  button.classList.remove(...(enabled ? DISABLED : ENABLED));
  button.classList.add(...(enabled ? ENABLED : DISABLED));
  const label = button.querySelector('p');
  if (label) label.style.color = enabled ? TEXT_ON : TEXT_OFF;
  button.dataset.enabled = String(enabled);
  button.setAttribute('aria-disabled', String(!enabled));
}

/** Run handler only while the button is enabled. */
export function onPress(button, handler) {
  pressable(button, (e) => {
    if (button.dataset.enabled === 'true') handler(e);
  });
}
