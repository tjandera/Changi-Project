/** Tiny DOM helpers shared by every page. */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Fill every [data-bind="key"] under root with values[key] (text only). */
export function bind(root, values) {
  $$('[data-bind]', root).forEach((el) => {
    const key = el.dataset.bind;
    if (Object.prototype.hasOwnProperty.call(values, key)) el.textContent = values[key];
  });
}

/** Parse an HTML string into a single element. */
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

/**
 * Render a list from a [data-template] child of a [data-list] container.
 * The template element is kept (hidden) the first time, then cloned per item.
 */
export function renderList(container, items, render) {
  if (!container) return;
  if (!container._template) {
    const tpl = $('[data-template]', container);
    container._template = tpl.cloneNode(true);
    container._template.removeAttribute('data-template');
  }
  container.replaceChildren();
  items.forEach((item, i) => {
    const node = container._template.cloneNode(true);
    render(node, item, i);
    container.appendChild(node);
  });
}

/** Make a div behave like a button for keyboard users without changing its markup. */
export function pressable(el, handler) {
  if (!el) return;
  if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
  el.addEventListener('click', handler);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  });
}

/** Close a popup when the user clicks outside `keepInside` or presses Escape. */
export function onDismiss(keepInside, close) {
  const onDown = (e) => {
    if (!keepInside.some((el) => el && el.contains(e.target))) cleanup(true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') cleanup(true);
  };
  function cleanup(run) {
    document.removeEventListener('mousedown', onDown, true);
    document.removeEventListener('keydown', onKey, true);
    if (run) close();
  }
  setTimeout(() => {
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
  });
  return () => cleanup(false);
}
