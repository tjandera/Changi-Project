/** FAQ: tabs + accordions rendered from data/faq.json. */
import { api } from '../models/api.js';
import { $, bind } from '../views/dom.js';
import { wireAccordion } from '../views/accordion.js';
import { boot, fail } from './boot.js';

try {
  await boot();
  const tabs = await api.getFaq();
  const tablist = $('[data-component="faq-tabs"]');
  const underline = $('[data-component="faq-underline"]');
  const list = $('[data-list="faq-items"]');
  const tabTemplate = $('[data-template="faq-tab"]', tablist);
  const itemTemplate = $('[data-template="faq-item"]', list);
  tabTemplate.remove();
  itemTemplate.remove();

  const tabNodes = tabs.map((tab, i) => {
    const node = tabTemplate.cloneNode(true);
    node.removeAttribute('data-template');
    bind(node, { 'tab.label': tab.label });
    tablist.insertBefore(node, underline.previousElementSibling);
    $('[role="tab"]', node).addEventListener('click', () => select(i));
    return node;
  });

  function select(index) {
    tabNodes.forEach((node, i) => {
      const tab = $('[role="tab"]', node);
      tab.setAttribute('aria-selected', String(i === index));
      $('p', tab).style.color = i === index ? '#121212' : '#999999';
    });
    const active = $('[role="tab"]', tabNodes[index]);
    underline.style.left = `${active.getBoundingClientRect().left - tablist.getBoundingClientRect().left + tablist.scrollLeft}px`;
    underline.style.width = `${active.getBoundingClientRect().width}px`;

    list.replaceChildren();
    tabs[index].items.forEach((item) => {
      const node = itemTemplate.cloneNode(true);
      node.removeAttribute('data-template');
      bind(node, { 'item.question': item.question });
      wireAccordion(node, item);
      list.appendChild(node);
    });
  }

  select(0);
  window.addEventListener('resize', () => {
    const i = tabNodes.findIndex((n) => $('[role="tab"]', n).getAttribute('aria-selected') === 'true');
    const active = $('[role="tab"]', tabNodes[i]);
    underline.style.left = `${active.getBoundingClientRect().left - tablist.getBoundingClientRect().left + tablist.scrollLeft}px`;
    underline.style.width = `${active.getBoundingClientRect().width}px`;
  });
} catch (err) {
  fail(err);
}
