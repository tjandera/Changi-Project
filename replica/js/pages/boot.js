/** Shared start-up for every page: load config, wire header/tooltips/labels. */
import { api } from '../api.js';
import { initChrome } from '../components/chrome.js';

export async function boot() {
  const config = await api.getConfig();
  initChrome(config);
  return config;
}

/** Report a data-loading failure on the page instead of failing silently. */
export function fail(err) {
  console.error(err);
  const note = document.createElement('div');
  note.className = 'replica-error';
  note.textContent = `Could not load page data: ${err.message}. Serve the folder over http (see README).`;
  document.body.appendChild(note);
}
