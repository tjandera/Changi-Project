/**
 * Page language switch (English <-> Chinese), the replica's stand-in for the live site's
 * Google Translate button. It walks the page's text, swaps it for the dictionary translation
 * and keeps the original so switching back restores it exactly. A MutationObserver translates
 * content the page builds later (dropdowns, calendar, dialogs, summary values).
 */
import { api } from '../models/api.js';
import { LANGUAGES, getLang, makeTranslator, setLang } from '../models/i18n.js';
import { $$ } from './dom.js';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
const ATTRS = ['placeholder', 'title', 'alt'];
const CHANGE_EVENT = 'oaci:languagechange';

export const currentLanguage = () => getLang();

export async function initLanguage() {
  const buttons = $$('[data-action="toggle-language"]');
  let translate = null;
  let observer = null;
  const originals = new Map(); // Text node -> English text
  const attrOriginals = new Map(); // Element -> { attr: English text }
  const written = new WeakMap(); // Text node -> the translation we wrote (to ignore our own mutation)

  const skipped = (el) => !el || SKIP_TAGS.has(el.tagName) || el.closest('[data-i18n="off"]');

  function translateText(node) {
    if (skipped(node.parentElement)) return;
    const value = node.nodeValue;
    if (written.get(node) === value) return; // already translated
    // A context key ("footer-site::Airport") wins, for words the live page words differently in a list.
    const ctx = node.parentElement.closest('[data-i18n-ctx]')?.dataset.i18nCtx;
    const out = (ctx && translate(`${ctx}::${value.trim()}`)) || translate(value);
    if (out === null || out === value) return;
    originals.set(node, value);
    written.set(node, out);
    node.nodeValue = out;
  }

  function translateAttrs(el) {
    if (skipped(el)) return;
    ATTRS.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value) return;
      const saved = attrOriginals.get(el)?.[attr];
      if (saved !== undefined && el.getAttribute(attr) !== saved && translate(saved) === value)
        return;
      const out = translate(value);
      if (out === null || out === value) return;
      attrOriginals.set(el, { ...attrOriginals.get(el), [attr]: value });
      el.setAttribute(attr, out);
    });
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) return translateText(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateAttrs(root);
    root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach(translateAttrs);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateText(node);
  }

  function restore() {
    originals.forEach((text, node) => {
      if (node.isConnected && written.get(node) === node.nodeValue) node.nodeValue = text;
      written.delete(node);
    });
    originals.clear();
    attrOriginals.forEach((attrs, el) => {
      if (el.isConnected)
        Object.entries(attrs).forEach(([attr, text]) => el.setAttribute(attr, text));
    });
    attrOriginals.clear();
  }

  function observe() {
    observer = new MutationObserver((mutations) => {
      observer.disconnect();
      mutations.forEach((m) => {
        if (m.type === 'characterData') translateText(m.target);
        else if (m.type === 'attributes') translateAttrs(m.target);
        else m.addedNodes.forEach(translateTree);
      });
      attach();
    });
    attach();
  }
  const attach = () =>
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });

  async function apply(lang) {
    if (observer) observer.disconnect();
    observer = null;
    restore();
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    buttons.forEach((b) => {
      b.textContent = LANGUAGES[lang].label;
      b.setAttribute('aria-label', 'Toggle Language');
      b.removeAttribute('title');
    });
    if (lang === 'zh') {
      translate = makeTranslator(await api.getTranslations('zh'));
      translateTree(document.body);
      observe();
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { lang } }));
  }

  buttons.forEach((b) => {
    b.setAttribute('data-i18n', 'off');
    b.addEventListener('click', async () => {
      const next = LANGUAGES[getLang()].next;
      setLang(next);
      await apply(next);
    });
  });

  await apply(getLang());
}

/** Run `fn(lang)` whenever the language changes (for content a controller renders from data). */
export const onLanguageChange = (fn) =>
  window.addEventListener(CHANGE_EVENT, (e) => fn(e.detail.lang));
