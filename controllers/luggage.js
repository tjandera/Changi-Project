/** Step 2 · Luggage Details: steppers, per-row price, totals. */
import { $, $$, bind } from '../views/scripts/dom.js';
import { setEnabled, onPress } from '../views/scripts/button.js';
import { showOddSized } from '../views/scripts/dialog.js';
import { fillSummary, wireSummary } from '../views/scripts/summary.js';
import { money, viewModel } from '../models/format.js';
import { guard, save, totalItems } from '../models/store.js';
import { nextRoute } from '../models/flow.js';
import { navigate } from '../models/leave.js';
import { endLoading } from '../views/scripts/loading.js';
import { boot, fail } from './boot.js';

// Live colours: zero counts are grey, non-zero are black.
const COUNT = { zero: 'rgb(171, 171, 171)', some: 'rgb(18, 18, 18)' };
const PRICE = { zero: 'rgb(153, 153, 153)', some: 'rgb(18, 18, 18)' };

try {
  const config = await boot();
  const booking = await guard('trip', config);
  if (booking) {
    const next = $('[data-action="next"]');
    const units = { standard: config.pricing.standardLuggage, oddSized: config.pricing.oddSizedItem };
    const max = config.booking.maxItemsPerType;

    const render = () => {
      $$('[data-stepper]').forEach((stepper) => {
        const key = stepper.dataset.stepper;
        const n = booking.luggage[key];
        const countEl = $('[data-bind="count"]', stepper);
        countEl.textContent = n;
        countEl.style.color = n ? COUNT.some : COUNT.zero;
        const row = stepper.closest('[data-hook~="luggage-row"]');
        const price = $('[data-component="row-price"]', row);
        $('[data-bind="subtotal"]', price).textContent = money(n * units[key]);
        $$('p', price).forEach((p) => (p.style.color = n ? PRICE.some : PRICE.zero));
      });
      const view = viewModel(booking, config);
      bind(document, view.values);
      fillSummary(document, view);
      setEnabled(next, totalItems(booking) > 0);
    };

    $$('[data-stepper]').forEach((stepper) => {
      const key = stepper.dataset.stepper;
      const change = (delta) => {
        booking.luggage[key] = Math.min(max, Math.max(0, booking.luggage[key] + delta));
        save(booking);
        render();
      };
      $('[data-action="decrement"]', stepper).addEventListener('click', () => change(-1));
      $('[data-action="increment"]', stepper).addEventListener('click', () => change(1));
    });

    $('[data-action="open-odd-sized"]').addEventListener('click', showOddSized);
    wireSummary(config);
    render();

    onPress(next, () => {
      save(booking);
      navigate(nextRoute(config, 'luggage'));
    });
  }
  endLoading();
} catch (err) {
  fail(err);
}
