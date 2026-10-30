/**
 * Language state and the pure text lookup. No DOM access.
 *
 * The live site translates the page with Google Translate. The replica cannot call it, so it
 * ships a dictionary: data/i18n/zh.json. Text that is not in the dictionary stays in English.
 * To support another language, add data/i18n/<code>.json (same shape) and a button for it.
 */
const STORAGE_KEY = 'oaci-replica-lang';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const LANGUAGES = { en: { next: 'zh', label: '中文' }, zh: { next: 'en', label: 'EN' } };

export function getLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function setLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode: the choice just lasts for this page */
  }
}

/**
 * Builds translate(text) from a dictionary file:
 *   strings      exact text (whitespace collapsed) -> translation
 *   patterns     [{ re, zh }] whole-text rules for text with numbers in it, e.g. "1 item(s)"; zh may use $1
 *   inline       [{ re, zh }] rules applied inside longer text, e.g. "17:00 SGT"
 *   dateFormat   how "31 Oct 2026" is written, with {y} {m} {d}
 * Returns null when there is nothing to translate, so callers leave the text alone.
 */
export function makeTranslator(dict) {
  const strings = dict.strings || {};
  const patterns = (dict.patterns || []).map((p) => ({ re: new RegExp(p.re), zh: p.zh }));
  const inline = (dict.inline || []).map((p) => ({ re: new RegExp(p.re, 'g'), zh: p.zh }));
  const dateRe = new RegExp(`(\\d{1,2}) (${MONTHS.join('|')}) (\\d{4})`, 'g');
  const dateFormat = dict.dateFormat || '{y}-{m}-{d}';

  return function translate(text) {
    const [, lead, body, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const core = body.replace(/\s+/g, ' ');
    if (!core) return null;
    let out = strings[core];
    if (out === undefined) {
      const hit = patterns.find((p) => p.re.test(core));
      if (hit) out = core.replace(hit.re, hit.zh);
    }
    if (out === undefined) {
      const dated = core.replace(dateRe, (_, d, mon, y) =>
        dateFormat
          .replace('{y}', y)
          .replace('{m}', MONTHS.indexOf(mon) + 1)
          .replace('{d}', Number(d)),
      );
      const swapped = inline.reduce((t, r) => t.replace(r.re, r.zh), dated);
      if (swapped !== core) out = swapped;
    }
    return out === undefined ? null : lead + out + trail;
  };
}
