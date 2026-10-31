/** Shared start-up for every page: put in the shared header/footer, load config, wire header/tooltips/labels. */
import { included } from '../views/components/include.js';
import { api } from '../models/api.js';
import { initChrome } from '../views/scripts/chrome.js';
import { hideLoading } from '../views/scripts/loading.js';

export async function boot() {
  const [config] = await Promise.all([api.getConfig(), included]);
  initChrome(config);
  return config;
}

/** Report a data-loading failure on the page instead of failing silently. */
export function fail(err) {
  console.error(err);
  hideLoading();
  const note = document.createElement('div');
  note.className = 'replica-error';
  note.textContent = `Could not load page data: ${err.message}. Serve the folder over http (see README).`;
  document.body.appendChild(note);
}
