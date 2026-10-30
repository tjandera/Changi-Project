/**
 * Page chrome shared by every route: header links, the "Leave this page?" guard,
 * info-icon tooltips, the 中文 button, the feedback tab and the replica label.
 */
import { $$, html, pressable } from '../dom.js';
import { clear } from '../store.js';
import { ask } from './dialog.js';
import { tooltip } from './templates.js';

const BOOKING_PAGES = new Set(['trip-details', 'luggage', 'personal-details', 'review']);

export function initChrome(config) {
  const page = document.body.dataset.page;
  const routes = config.routes;
  const targets = {
    home: routes.landing,
    faq: routes.faq,
    'manage-booking': routes.manageBooking,
    'book-now': routes.tripDetails,
  };

  $$('[data-nav]').forEach((el) => {
    const to = targets[el.dataset.nav];
    if (!to) return;
    pressable(el, async (e) => {
      e.preventDefault();
      // Live behaviour: leaving the booking flow from the header asks first and clears progress.
      if (BOOKING_PAGES.has(page)) {
        const choice = await ask(config.dialogs.leave);
        if (choice !== 'secondary') return;
        clear();
      }
      window.location.href = to;
    });
  });

  initTooltips(config.tooltips);
  addFeedbackTab();
  addReplicaLabel();

  // The live 中文 button runs Google Translate; translation is out of scope here.
  $$('[data-action="toggle-language"]').forEach((b) => b.setAttribute('title', 'Language switch is not part of this replica'));
}

/** Hover (desktop) or tap (touch) an info icon to show its tooltip. */
export function initTooltips(copy) {
  $$('[data-tooltip]').forEach((icon) => {
    const text = copy[icon.dataset.tooltip];
    if (!text) return;
    const host = icon.closest('.relative') || icon.parentElement;
    let tip = null;
    const show = () => {
      if (tip) return;
      tip = html(tooltip(text));
      host.appendChild(tip);
    };
    const hide = () => {
      if (tip) tip.remove();
      tip = null;
    };
    icon.addEventListener('mouseenter', show);
    icon.addEventListener('mouseleave', hide);
    icon.addEventListener('click', () => (tip ? hide() : show()));
  });
}

/** Visual copy of the Qualtrics "Give Feedback" tab (the survey itself is third-party). */
function addFeedbackTab() {
  document.body.appendChild(
    html(
      `<div class="replica-feedback" aria-hidden="true"><div class="replica-feedback__tab"><div>Give Feedback</div></div></div>`,
    ),
  );
}

function addReplicaLabel() {
  document.body.appendChild(
    html(
      `<div class="replica-label" role="note">Case-study replica · Not affiliated with Changi Airport Group · No data leaves this page</div>`,
    ),
  );
}
