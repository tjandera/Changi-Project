/**
 * "Leave this page?" bookkeeping, shared by every booking step.
 *
 * Live behaviour (read from the site's own page script, 31 Oct 2026): while Steps 2-4 are open (never Step 1, never the header links),
 * hiding the tab or window opens the "Leave this page?" dialog and closing/reloading the page shows
 * the browser's own confirmation. Both are switched off while the app itself is navigating
 * (Next buttons, Edit links, "Leave Page"), which the live site calls `isSkipLeaveCheck`.
 *
 * Every in-app navigation therefore goes through `navigate()` instead of touching window.location.
 */
let skip = false;

/** True while the app is moving to another page on purpose. */
export const isLeaveCheckSkipped = () => skip;

const listeners = [];

/** Run `fn(url)` just before the app moves to another page (used to show the loading overlay). */
export const beforeNavigate = (fn) => listeners.push(fn);

/** Go to another page without triggering the leave checks. */
export function navigate(url, { replace = false } = {}) {
  skip = true;
  listeners.forEach((fn) => fn(url));
  if (replace) window.location.replace(url);
  else window.location.href = url;
}
