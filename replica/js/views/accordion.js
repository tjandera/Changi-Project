/** FAQ accordion row (FAQ page and the landing page's FAQ block). */
import { html } from './dom.js';
import { faqAnswer } from './templates.js';

const plain = (q) => q.replace(/^\s*\d+\.\s*/, '').trim().toLowerCase();

export function wireAccordion(row, item) {
  const head = row.firstElementChild;
  const arrow = head.querySelector('img');
  head.setAttribute('role', 'button');
  head.setAttribute('tabindex', '0');
  head.setAttribute('aria-expanded', 'false');
  const toggle = () => {
    const open = row.querySelector(':scope > .pb-\\[16px\\]');
    if (open) open.remove();
    else row.appendChild(html(faqAnswer(item)));
    head.setAttribute('aria-expanded', String(!open));
    if (arrow) arrow.classList.toggle('rotate-180', !open);
  };
  head.addEventListener('click', toggle);
  head.addEventListener('keydown', (e) => e.key === 'Enter' && toggle());
}

/** Find the FAQ entry whose question matches a row's text (ignores the "1." numbering). */
export function findItem(tabs, questionText) {
  const target = plain(questionText);
  for (const tab of tabs) {
    const hit = tab.items.find((i) => plain(i.question) === target);
    if (hit) return hit;
  }
  return null;
}
