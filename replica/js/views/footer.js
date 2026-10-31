/**
 * Footer behaviour (compact footer below 1024px, full footer from 1024px).
 *
 * Every link goes to the page named in data/config.json under "footer" and opens in a new tab,
 * as on the live site (which uses click handlers, not <a> tags). The logo scrolls back to the top.
 * "Changi Sites" is the dropdown row of the compact footer.
 */
import { $, $$, html, pressable } from './dom.js';
import { footerSite } from './templates.js';

const open = (url) => window.open(url, '_blank', 'noopener,noreferrer');

/** Make an element open `url` on click / Enter / Space. */
function link(el, url) {
  if (!el || !url) return;
  el.setAttribute('role', 'link');
  pressable(el, () => open(url));
}

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

export function initFooter(footer = {}) {
  const compact = $('footer');
  if (!compact) return;
  const regions = [compact, compact.nextElementSibling].filter(Boolean);
  const within = (selector) => regions.flatMap((r) => $$(selector, r));

  // Text links: desktop columns, Changi Sites bar, Conditions of Use / Privacy Policy (both footers).
  const labelled = within('.cursor-pointer');
  const wire = (name, url) => labelled.filter((el) => text(el) === name).forEach((el) => link(el, url));
  (footer.columns || []).forEach((col) => col.items.forEach((item) => wire(item.name, item.url)));
  (footer.sites || []).forEach((s) => wire(s.site, s.url));
  (footer.legal || []).forEach((l) => wire(l.name, l.url));

  // App store buttons.
  (footer.appStores || []).forEach((a) =>
    within(`img[alt="${a.alt}"]`).forEach((img) => link(img, a.url)),
  );

  // Social icons: the icon's wrapper div carries the click.
  // Each wrapper holds two <img> (phone size and desktop size), so collect the wrappers once.
  (footer.social || []).forEach((s) => {
    const wrappers = new Set(
      within(`img[src="/follow-us/${s.icon}.svg"]`).map((img) => img.closest('.cursor-pointer')),
    );
    wrappers.forEach((el) => link(el, s.url));
  });

  // Sign Up button.
  within('button').filter((b) => text(b) === 'Sign Up').forEach((b) => link(b, footer.signUp));

  // Logo scrolls to the top of the page.
  within('img[alt="Changi Airport"]').forEach((logo) => {
    logo.setAttribute('role', 'button');
    pressable(logo, () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  });

  initSitesDropdown(footer.sites || []);
}

/**
 * Footer "Changi Sites : Airport" row (compact footer). Clicking it lists the sister sites under the
 * row and flips the arrow; clicking again closes it. Each row opens its site.
 */
function initSitesDropdown(sites) {
  const arrow = $('footer img[alt="Arrow Down"]');
  const head = arrow && arrow.closest('.border-t');
  if (!head || !sites.length) return;
  const list = head.parentElement;
  let rows = [];
  head.setAttribute('aria-expanded', 'false');
  pressable(head, () => {
    const isOpen = head.getAttribute('aria-expanded') !== 'true';
    head.setAttribute('aria-expanded', String(isOpen));
    arrow.classList.toggle('rotate-180', isOpen);
    if (isOpen) {
      rows = sites.map(({ site, url }) => {
        const row = list.appendChild(html(footerSite(site)));
        link(row, url);
        return row;
      });
    } else {
      rows.forEach((row) => row.remove());
      rows = [];
    }
  });
}
