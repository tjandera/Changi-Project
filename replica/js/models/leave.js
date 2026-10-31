/**
 * "Leave this page?" bookkeeping, shared by every booking step.
 *
 * Live behaviour (read from the site's own page script, 31 Oct 2026): while a booking step is open,
 * hiding the tab or window opens the "Leave this page?" dialog and closing/reloading the page shows
 * the browser's own confirmation. Both are switched off while the app itself is navigating
 * (Next buttons, Edit links, "Leave Page"), which the live site calls `isSkipLeaveCheck`.
 *
 * Every in-app navigation therefore goes through `navigate()` instead of touching window.location.
 */
let skip = false;

/** True while the app is moving to another page on purpose. */
export const isLeaveCheckSkipped = () => skip;

/** Go to another page without triggering the leave checks. */
export function navigate(url, { replace = false } = {}) {
  skip = true;
  if (replace) window.location.replace(url);
  else window.location.href = url;
}
