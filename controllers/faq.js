/** FAQ: tabs + accordions rendered from data/faq.json. */
import { api } from '../models/api.js';
import { $, bind } from '../views/scripts/dom.js';
import { wireAccordion } from '../views/scripts/accordion.js';
import { currentLanguage, onLanguageChange } from '../views/scripts/language.js';
import { boot, fail } from './boot.js';

try {
  await boot();
  let tabs = await api.getFaq(currentLanguage());
  let selected = 0;
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
    selected = index;
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

  // The question and answer text comes from data, so switching language loads the other file.
  onLanguageChange(async (lang) => {
    tabs = await api.getFaq(lang);
    tabNodes.forEach((node, i) => bind(node, { 'tab.label': tabs[i].label }));
    select(selected);
  });

  window.addEventListener('resize', () => {
    const active = $('[role="tab"]', tabNodes[selected]);
    underline.style.left = `${active.getBoundingClientRect().left - tablist.getBoundingClientRect().left + tablist.scrollLeft}px`;
    underline.style.width = `${active.getBoundingClientRect().width}px`;
  });
} catch (err) {
  fail(err);
}
