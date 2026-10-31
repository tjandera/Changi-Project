/**
 * Full-screen loading overlay: the page behind it is blurred and three purple dots bounce.
 *
 * Live behaviour (screen recording, 31 Oct 2026): it shows on the booking steps while a page loads,
 * and from the moment a link or button moves you to a booking step, for roughly a third of a second.
 * Header links to FAQs / Manage Booking show no overlay, only the page fade-in (see views/components/shared.css).
 * The dots are the live site's Lottie file (/animations/loading.json) rebuilt as SVG + CSS.
 */
import { html } from './dom.js';

/** The overlay stays up at least this long once shown, so the dots are seen (live: about 0.25-0.4s). */
const MIN_VISIBLE_MS = 300;
/** If a page never reports it is ready, drop the overlay anyway. */
const GIVE_UP_MS = 6000;

/** Live: the page fade is about half done when the overlay lifts, so it starts this long before. */
const FADE_LEAD_MS = 250;

let overlay = null;
let shownAt = 0;

const main = () => document.querySelector('main.page-main');

/** The content is hidden by CSS until now; adding the class starts its fade-in. */
function releaseContent() {
  const el = main();
  if (el) el.classList.add('replica-ready');
}

const dots = () => `<div class="replica-loading" data-component="loading" role="status" aria-label="Loading">
  <svg viewBox="0 0 300 300" width="175" height="175" aria-hidden="true">
    <circle class="replica-loading__dot" cx="101.95" cy="142.72" r="11.47" />
    <circle class="replica-loading__dot" cx="142.72" cy="142.72" r="11.47" style="animation-delay: 83.33ms" />
    <circle class="replica-loading__dot" cx="183.5" cy="142.72" r="11.47" style="animation-delay: 166.67ms" />
  </svg>
</div>`;

export function showLoading() {
  if (overlay) return;
  overlay = html(dots());
  shownAt = performance.now();
  document.body.appendChild(overlay);
  setTimeout(hideLoading, GIVE_UP_MS);
}

export function hideLoading() {
  if (overlay) overlay.remove();
  overlay = null;
  releaseContent();
}

/** A booking step calls this once its data is on screen. */
export function finishLoading() {
  const wait = Math.max(0, shownAt + MIN_VISIBLE_MS - performance.now());
  setTimeout(releaseContent, Math.max(0, wait - FADE_LEAD_MS));
  setTimeout(hideLoading, wait);
}

// Coming back to a page from the back/forward cache must not show a stale overlay.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) hideLoading();
});
