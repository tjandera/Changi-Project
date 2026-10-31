/**
 * FAQs  ·  /faq/
 * HTML: views/pages/faq/index.html
 *
 * What this page does:
 *   1. Builds one tab per FAQ section (Overview, Booking, Check-in, After Check-in) from models/data/faq.json.
 *   2. Clicking a tab moves the black underline under it and lists that section's questions.
 *   3. Each question opens and closes to show its answer.
 *   4. Switching to 中文 reloads the questions from the Chinese file (models/data/i18n/faq.zh.json).
 *
 * The HTML holds one hidden example tab and one example question (data-template). They are copied for each item.
 */

// Models: data and state
import { api } from '../models/api.js';
// Views: what the user sees
import { $, fillBindings } from '../views/scripts/dom.js';
import { setUpAccordion } from '../views/scripts/accordion.js';
import { currentLanguage, onLanguageChange } from '../views/scripts/language.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

// Tab text colours from the live site.
const TAB_COLOUR = { selected: '#121212', other: '#999999' };

showPage().catch(showPageError);

async function showPage() {
  await startPage();
  let faqSections = await api.getFaq(currentLanguage());
  let selectedIndex = 0;

  const tabBar = $('[data-component="faq-tabs"]');
  const underline = $('[data-component="faq-underline"]');
  const questionList = $('[data-list="faq-items"]');

  // Take the two examples out of the page; they are only used as patterns to copy.
  const tabTemplate = $('[data-template="faq-tab"]', tabBar);
  const questionTemplate = $('[data-template="faq-item"]', questionList);
  tabTemplate.remove();
  questionTemplate.remove();

  const tabs = faqSections.map((section, index) => {
    const tab = copyTemplate(tabTemplate);
    fillBindings(tab, { 'tab.label': section.label });
    tabBar.insertBefore(tab, underline.previousElementSibling);
    $('[role="tab"]', tab).addEventListener('click', () => selectTab(index));
    return tab;
  });

  /** Highlights one tab, moves the underline under it and lists its questions. */
  function selectTab(index) {
    selectedIndex = index;

    tabs.forEach((tab, tabIndex) => {
      const tabButton = $('[role="tab"]', tab);
      const isSelected = tabIndex === index;
      tabButton.setAttribute('aria-selected', String(isSelected));
      $('p', tabButton).style.color = isSelected ? TAB_COLOUR.selected : TAB_COLOUR.other;
    });
    moveUnderline();

    questionList.replaceChildren();
    faqSections[index].items.forEach((faqItem) => {
      const questionRow = copyTemplate(questionTemplate);
      fillBindings(questionRow, { 'item.question': faqItem.question });
      setUpAccordion(questionRow, faqItem);
      questionList.appendChild(questionRow);
    });
  }

  /** Puts the underline exactly under the selected tab (its left edge and width). */
  function moveUnderline() {
    const selectedTab = $('[role="tab"]', tabs[selectedIndex]);
    const tabBox = selectedTab.getBoundingClientRect();
    const barBox = tabBar.getBoundingClientRect();
    underline.style.left = `${tabBox.left - barBox.left + tabBar.scrollLeft}px`;
    underline.style.width = `${tabBox.width}px`;
  }

  selectTab(0);

  // The questions and answers are data, so switching language loads the other file.
  onLanguageChange(async (language) => {
    faqSections = await api.getFaq(language);
    tabs.forEach((tab, index) => fillBindings(tab, { 'tab.label': faqSections[index].label }));
    selectTab(selectedIndex);
  });

  window.addEventListener('resize', moveUnderline);
}

/** A fresh copy of a hidden example element, ready to fill in. */
function copyTemplate(template) {
  const copy = template.cloneNode(true);
  copy.removeAttribute('data-template');
  return copy;
}
