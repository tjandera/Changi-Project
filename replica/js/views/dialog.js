/** MUI Dialog behaviour: mount into <body>, lock scroll, close on backdrop / Escape. */
import { html } from './dom.js';
import { confirmDialog, oddSizedDialog } from './templates.js';

function mount(markup, { onClose } = {}) {
  const node = html(markup);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.appendChild(node);

  const close = () => {
    node.remove();
    document.body.style.overflow = prevOverflow;
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  node.querySelector('.MuiDialog-container').addEventListener('mousedown', (e) => {
    if (e.target === e.currentTarget) close();
  });
  const paper = node.querySelector('[role="dialog"]');
  paper.setAttribute('tabindex', '-1');
  paper.focus({ preventScroll: true });
  return { node, close };
}

/**
 * Two-action dialog using the live "Leave this page?" layout.
 * @param {{title, body, primary, secondary}} copy  usually from config.dialogs.*
 * @returns {Promise<'primary'|'secondary'|'dismissed'>}
 */
export function ask(copy) {
  return new Promise((resolve) => {
    let result = 'dismissed';
    const { node, close } = mount(confirmDialog(copy), { onClose: () => resolve(result) });
    node.querySelectorAll('[data-dialog]').forEach((el) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      const pick = () => {
        result = el.dataset.dialog;
        close();
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', (e) => e.key === 'Enter' && pick());
    });
  });
}

export function showOddSized() {
  const { node, close } = mount(oddSizedDialog());
  node.querySelector('[data-dialog="close"]').addEventListener('click', close);
}
