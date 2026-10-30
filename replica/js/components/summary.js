/**
 * Booking Summary card (sidebar on Steps 2–3) and the Review card (Step 4):
 * fills values, renders one line per luggage type, wires the edit pencils
 * and the collapse arrow.
 */
import { $, $$, bind, renderList } from '../dom.js';

export function fillSummary(root, view) {
  bind(root, view.values);
  $$('[data-list="luggage-lines"]', root).forEach((list) =>
    renderList(list, view.lines, (node, line) =>
      bind(node, { 'line.label': line.label, 'line.subtotal': line.subtotal, 'line.itemsLabel': line.itemsLabel }),
    ),
  );
}

export function wireSummary(config) {
  const edits = {
    'edit-trip': config.routes.tripDetails,
    'edit-luggage': config.routes.luggage,
    'edit-contact': config.routes.personalDetails,
  };
  Object.entries(edits).forEach(([action, href]) => {
    $$(`[data-action="${action}"]`).forEach((el) => {
      el.setAttribute('role', 'link');
      el.setAttribute('tabindex', '0');
      const go = () => (window.location.href = href);
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    });
  });

  const toggle = $('[data-action="toggle-summary"]');
  const body = $('[data-component="summary-body"]');
  if (toggle && body) {
    const arrow = toggle.querySelector('img[alt="arrow-down-black"]');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.addEventListener('click', () => {
      const open = body.hidden;
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (arrow) arrow.src = open ? '/icons/arrow-up-black.svg' : '/icons/arrow-down-black.svg';
    });
  }
}
