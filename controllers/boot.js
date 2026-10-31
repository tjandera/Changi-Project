/**
 * Start-up shared by every page
 *
 * Every controller begins with `await startPage()` and ends with `.catch(showPageError)`.
 *
 * startPage():
 *   1. waits for the shared header, footer and 中文 button to be put into the page (views/components/include.js)
 *      while it loads the site settings (models/data/config.json), both at the same time
 *   2. sets up the parts every page has: header links, Book Now, mobile menu, tooltips, footer links,
 *      the 中文 switch, the feedback tab and the loading overlay (views/scripts/chrome.js)
 *   3. returns the settings, so the page can use prices, routes, dialog text and so on
 */

// Models: data and state
import { api } from '../models/api.js';
// Views: what the user sees
import { componentsLoaded } from '../views/components/include.js';
import { setUpSharedParts } from '../views/scripts/chrome.js';
import { hideLoading } from '../views/scripts/loading.js';

export async function startPage() {
  const [config] = await Promise.all([api.getConfig(), componentsLoaded]);
  setUpSharedParts(config);
  return config;
}

/** Shows what went wrong at the top of the page instead of failing silently (e.g. data files not found). */
export function showPageError(error) {
  console.error(error);
  hideLoading();
  const message = document.createElement('div');
  message.className = 'replica-error';
  message.textContent = `Could not load page data: ${error.message}. Serve the folder over http (see README).`;
  document.body.appendChild(message);
}
