/**
 * The site's pill buttons (Next, Book Now, Make Payment, Retrieve Booking) are <div>s
 * whose look is driven by three Tailwind classes plus the label colour.
 * Class sets below are the exact ones the live site toggles.
 */
import { pressable } from '../dom.js';

const ENABLED = ['bg-black', 'border-black', 'cursor-pointer'];
const DISABLED = ['bg-[#E5E5E5]', 'border-[#CCCCCC]', 'cursor-not-allowed'];
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
