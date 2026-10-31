/**
 * Shared markup loader.
 *
 * The header, footer and 中文 button are written once, in /views/components/<name>.html. A page marks where each goes:
 *
 *   <div data-include="header"></div>
 *
 * This module swaps every such slot for the file's markup. It starts as soon as the page is parsed (the <script>
 * in each <head>), and boot() waits for `included` before any page script looks at the DOM, so the scripts see
 * the same page as if the markup were written inline.
 */
const cache = new Map();

function load(name) {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`/views/components/${name}.html`).then((res) => {
        if (!res.ok) throw new Error(`/views/components/${name}.html: ${res.status}`);
        return res.text();
      }),
    );
  }
  return cache.get(name);
}

async function fill(slot) {
  const template = document.createElement('template');
  template.innerHTML = (await load(slot.dataset.include)).trim();
  slot.replaceWith(template.content);
}

/** Resolves once every slot on the page holds its markup. */
export const included = Promise.all([...document.querySelectorAll('[data-include]')].map(fill));
