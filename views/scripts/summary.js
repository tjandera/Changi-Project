/**
 * Booking Summary card (sidebar on Steps 2–3) and the Review card (Step 4):
 * fills values, renders one line per luggage type, wires the edit pencils
 * and the collapse arrow.
 */
import { $, $$, bind, renderList } from './dom.js';
import { navigate } from '../../models/leave.js';

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
      const go = () => navigate(href);
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    });
  });

  // Live behaviour (measured 30 Oct 2026): the card starts expanded at >= 1024px and collapsed below it,
  // follows the breakpoint when the window is resized, and the header row toggles it at any width.
  // The body is removed rather than animated; the arrow swaps between arrow-down and arrow-up.
  const toggle = $('[data-action="toggle-summary"]');
  const body = $('[data-component="summary-body"]');
  if (toggle && body) {
    const arrow = toggle.querySelector('img[alt="arrow-down-black"]');
    const setOpen = (open) => {
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (arrow) arrow.src = open ? '/icons/arrow-up-black.svg' : '/icons/arrow-down-black.svg';
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    setOpen(desktop.matches);
    desktop.addEventListener('change', (e) => setOpen(e.matches));
    toggle.addEventListener('click', () => setOpen(body.hidden));
  }
}
