/**
 * Page chrome shared by every route: header links, the "Leave this page?" guard,
 * info-icon tooltips, the footer links (footer.js), the 中文 button, the feedback tab + slide-out panel and the replica label.
 */
import { $, $$, html, pressable } from './dom.js';
import { clear } from '../../models/store.js';
import { beforeNavigate, isLeaveCheckSkipped, navigate } from '../../models/leave.js';
import { ask } from './dialog.js';
import { initLanguage } from './language.js';
import { initFooter } from './footer.js';
import { showLoading } from './loading.js';
import { mobileMenu, tooltip } from './templates.js';

// Pages that show the loading overlay while they load (all four booking steps).
const LOADING_PAGES = new Set(['trip-details', 'luggage', 'personal-details', 'review']);

// Steps 2-4. Step 1 (trip-details) never shows the "Leave this page?" checks.
const LEAVE_CHECK_PAGES = new Set(['luggage', 'personal-details', 'review']);

export function initChrome(config) {
  const page = document.body.dataset.page;
  const routes = config.routes;
  const targets = {
    home: routes.landing,
    faq: routes.faq,
    'manage-booking': routes.manageBooking,
    'book-now': routes.tripDetails,
  };

  // Loading overlay (live behaviour): shown while a booking step loads, and as soon as the app
  // starts moving to one, so the old page blurs while the next one loads.
  if (LOADING_PAGES.has(page)) showLoading();
  const path = (url) => new URL(url, window.location.href).pathname.replace(/\/$/, '');
  const stepPaths = new Set(
    [routes.tripDetails, routes.luggage, routes.personalDetails, routes.review].filter(Boolean).map(path),
  );
  beforeNavigate((url) => {
    if (stepPaths.has(path(url))) showLoading();
  });

  // Header links (also used by the mobile menu). Live behaviour: they just navigate, with no
  // "Leave this page?" dialog, on every page including the booking steps.
  const bindNav = (root) =>
    $$('[data-nav]', root).forEach((el) => {
      const to = targets[el.dataset.nav];
      if (!to) return;
      pressable(el, (e) => {
        e.preventDefault();
        navigate(to);
      });
    });
  bindNav(document);

  // "Leave this page?" on Steps 2-4 only. Live behaviour, three triggers:
  //   1. the tab or window is hidden (switching tabs, minimising): the dialog is waiting when you return;
  //   2. Back/Forward lands on the step;
  //   3. the tab is closed or reloaded: the browser shows its own confirmation (its text can't be changed).
  // Continue keeps the booking; Leave Page clears it and goes home. In-app navigation skips all three.
  if (LEAVE_CHECK_PAGES.has(page)) {
    let asking = false;
    const askToLeave = async () => {
      if (asking || isLeaveCheckSkipped()) return;
      asking = true;
      const choice = await ask(config.dialogs.leave);
      asking = false;
      if (choice !== 'secondary') return;
      clear();
      navigate(routes.landing);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') askToLeave();
    });
    window.addEventListener('beforeunload', (e) => {
      if (isLeaveCheckSkipped()) return;
      e.preventDefault();
      e.returnValue = '';
    });
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') askToLeave();
    // Back/forward cache restores the page without reloading it.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) askToLeave();
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
  initFooter(config.footer);
  addFeedbackTab(config);
  addReplicaLabel();

  // The 中文 / EN button (the live site uses Google Translate; the replica uses data/i18n/zh.json).
  initLanguage().catch((err) => console.error('Language switch failed:', err));
}

/** Hover (desktop) or tap (touch) an info icon to show its tooltip. */
export function initTooltips(copy) {
  $$('[data-tooltip]').forEach((icon) => {
    const text = copy[icon.dataset.tooltip];
    if (!text) return;
    const host = icon.closest('[data-hook~="field"], [data-hook~="tooltip-host"]') || icon.parentElement;
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
 * Panel body. With `feedback.surveyUrl` set in data/config.json it is the survey iframe (as on the live site).
 * Without it, it shows the grey "page could not load" state a blocked survey frame shows in the browser.
 */
function surveyFrame(config) {
  const url = config?.feedback?.surveyUrl;
  if (url) {
    return `<iframe class="replica-feedback-panel__frame" id="replica-feedback-frame" title="OACI Feedback" src="${url}"></iframe>`;
  }
  return `<div class="replica-feedback-panel__body" role="img" aria-label="The feedback survey is not part of this replica">
        <svg viewBox="0 0 72 87" width="36" height="43.5" shape-rendering="crispEdges" aria-hidden="true"><path fill="#acacac" d="M0 0h51v7h-51zM0 7h7v7h-7zM37 7h7v7h-7zM51 7h7v7h-7zM0 14h7v7h-7zM37 14h7v7h-7zM58 14h7v7h-7zM0 21h7v7h-7zM18 21h7v7h-7zM37 21h7v7h-7zM65 21h7v7h-7zM0 28h7v7h-7zM18 28h7v7h-7zM37 28h35v7h-35zM0 35h7v21h-7zM65 35h7v21h-7zM0 56h7v7h-7zM25 56h22v7h-22zM65 56h7v7h-7zM0 63h7v7h-7zM18 63h7v7h-7zM47 63h7v7h-7zM65 63h7v7h-7zM0 70h7v10h-7zM65 70h7v10h-7zM0 80h72v7h-72z"/></svg>
      <p class="replica-feedback-panel__blocked" data-i18n="off">This content is blocked. Contact the site owner to fix<br />the issue.</p>
      </div>`;
}

/**
 * "Give Feedback" tab and its slide-out panel (look and motion copied from the live Qualtrics widget).
 * Tab click toggles, the X and Escape close. The survey itself is a third-party iframe, so the panel
 * body is a placeholder. Desktop: slides in from the right. Under 768px: pulls up with a dark overlay.
 */
function addFeedbackTab(config) {
  const tab = html(
    `<button type="button" class="replica-feedback" role="button" id="replica-feedback-btn" aria-expanded="false" aria-controls="replica-feedback-panel"><div class="replica-feedback__tab"><div>Give Feedback</div></div></button>`,
  );
  const panel = html(
    `<div class="replica-feedback-panel" id="replica-feedback-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-labelledby="replica-feedback-btn" tabindex="-1">
      <div class="replica-feedback-panel__close">
        <button type="button" role="button" aria-label="Close"><svg viewBox="0 0 17 17" aria-hidden="true"><path d="M2.2 2.2 14.8 14.8M14.8 2.2 2.2 14.8" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg></button>
        <div class="replica-feedback-panel__close-bg"></div>
      </div>
      ${surveyFrame(config)}
    </div>`,
  );
  const closeBtn = $('.replica-feedback-panel__close button', panel);
  // Decided by device, like Qualtrics: phones and tablets get the pull-up, every desktop window the side panel.
  const mobile =
    navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
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
    // Like live: opening moves focus into the panel (no visible ring); closing returns it to the tab.
    if (open) panel.focus({ preventScroll: true });
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
