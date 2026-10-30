/**
 * Page chrome shared by every route: header links, the "Leave this page?" guard,
 * info-icon tooltips, the 中文 button, the feedback tab + slide-out panel and the replica label.
 */
import { $, $$, html, pressable } from './dom.js';
import { clear } from '../models/store.js';
import { ask } from './dialog.js';
import { mobileMenu, tooltip } from './templates.js';

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

  // Header links (also used by the mobile menu). During a booking they ask "Leave this page?" first.
  const bindNav = (root) =>
    $$('[data-nav]', root).forEach((el) => {
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
  bindNav(document);

  // Browser Back/Forward onto a booking step (live behaviour): the page shows the same
  // "Leave this page?" dialog. Continue keeps the booking; Leave clears it and goes home.
  // The live site has no beforeunload prompt, so closing or reloading the tab is not intercepted.
  if (BOOKING_PAGES.has(page)) {
    let asking = false;
    const guardHistory = async () => {
      if (asking) return;
      asking = true;
      const choice = await ask(config.dialogs.leave);
      asking = false;
      if (choice !== 'secondary') return;
      clear();
      window.location.href = routes.landing;
    };
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') guardHistory();
    // Back/forward cache restores the page without reloading it.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) guardHistory();
    });
  }

  // Mobile menu: the hamburger opens a full-screen white overlay; its X removes it again.
  const menuButton = $('header button[aria-label="Open menu"]');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      if ($('[data-component="mobile-menu"]')) return;
      const menu = html(mobileMenu());
      $('header').after(menu);
      bindNav(menu);
      pressable($('[data-action="close-menu"]', menu), () => menu.remove());
    });
  }

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

/**
 * "Give Feedback" tab and its slide-out panel (look and motion copied from the live Qualtrics widget).
 * Tab click toggles, the X and Escape close. The survey itself is a third-party iframe, so the panel
 * body is a placeholder. Desktop: slides in from the right. Under 768px: pulls up with a dark overlay.
 */
function addFeedbackTab() {
  const tab = html(
    `<button type="button" class="replica-feedback" role="button" id="replica-feedback-btn" aria-expanded="false" aria-controls="replica-feedback-panel"><div class="replica-feedback__tab"><div>Give Feedback</div></div></button>`,
  );
  const panel = html(
    `<div class="replica-feedback-panel" id="replica-feedback-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-labelledby="replica-feedback-btn">
      <div class="replica-feedback-panel__close">
        <button type="button" role="button" aria-label="Close"><svg viewBox="0 0 17 17" aria-hidden="true"><path d="M2 2 15 15M15 2 2 15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg></button>
        <div class="replica-feedback-panel__close-bg"></div>
      </div>
      <div class="replica-feedback-panel__body">The feedback survey is not part of this replica.</div>
    </div>`,
  );
  const closeBtn = $('.replica-feedback-panel__close button', panel);
  // Decided by device, like Qualtrics: phones and tablets get the pull-up, every desktop window the side panel.
  const mobile = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  document.documentElement.classList.toggle('replica-mobile-device', mobile);
  let shadow = null;

  const setOpen = (open) => {
    tab.classList.toggle('is-open', open);
    panel.classList.toggle('is-open', open);
    tab.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if (open && mobile && !shadow) {
      shadow = html('<div class="replica-feedback-shadowbox"></div>');
      document.body.appendChild(shadow);
    }
    if (!open && shadow) {
      shadow.remove();
      shadow = null;
    }
    tab.classList.add('is-ring');
    if (open) closeBtn.focus({ preventScroll: true });
    else tab.focus({ preventScroll: true });
  };
  const isOpen = () => tab.getAttribute('aria-expanded') === 'true';

  tab.addEventListener('click', () => setOpen(!isOpen()));
  tab.addEventListener('blur', () => tab.classList.remove('is-ring'));
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });

  document.body.append(tab, panel);
}

function addReplicaLabel() {
  document.body.appendChild(
    html(
      `<div class="replica-label" role="note">Case-study replica · Not affiliated with Changi Airport Group · No data leaves this page</div>`,
    ),
  );
}
