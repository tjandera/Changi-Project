/**
 * Behaviour for the MUI-rendered controls: outlined text fields, the phone field
 * with its country dropdown, and the Terms checkbox. State classes (Mui-focused,
 * Mui-error, Mui-checked) are the ones MUI applies on the live site; their styles
 * live in /replica/css/mui-runtime.css.
 */
import { html, onDismiss } from './dom.js';
import { checkIcon, countryList } from './templates.js';

const LABEL_OK = 'rgb(18, 18, 18)';
const LABEL_ERROR = 'rgb(204, 16, 0)';

/**
 * Outlined text field. Red label + border appear as soon as something typed is wrong,
 * and update live with every keystroke. An empty field is never shown as an error.
 * `showErrors: false` keeps the field required (it still blocks Next) but never turns it red (names).
 * @param {HTMLInputElement} input
 * @param {{validate?: (v:string)=>boolean, showErrors?: boolean, format?: (v:string)=>string, onChange?: (v:string)=>void}} opts
 */
export function textField(
  input,
  { validate = (v) => v.trim() !== '', showErrors = true, format, onChange } = {},
) {
  const root = input.closest('.MuiInputBase-root');
  const label = input.closest('[data-hook~="field"]')?.querySelector('p');
  let touched = false;

  const showError = (on) => {
    root.classList.toggle('Mui-error', on);
    input.setAttribute('aria-invalid', String(on));
    if (label) label.style.color = on ? LABEL_ERROR : LABEL_OK;
  };
  const refresh = () =>
    showError(showErrors && touched && input.value.trim() !== '' && !validate(input.value));

  input.addEventListener('focus', () => root.classList.add('Mui-focused'));
  input.addEventListener('blur', () => {
    root.classList.remove('Mui-focused');
    if (input.value !== '') touched = true;
    refresh();
  });
  input.addEventListener('input', () => {
    if (input.value !== '') touched = true; // errors show from the first character, not after leaving
    if (format) {
      const formatted = format(input.value);
      if (formatted !== input.value) input.value = formatted;
    }
    if (onChange) onChange(input.value);
    refresh();
  });

  return {
    isValid: () => validate(input.value),
    set(value) {
      input.value = value || '';
      touched = Boolean(value);
      refresh();
    },
    refresh,
  };
}

/**
 * Slide a list so `row` is visible, the way the live country list does: scrolling down stops with the
 * row on the bottom edge, scrolling up with it on the top edge. Speed grows with distance (about
 * 1.4s for the whole list). Wheel, touch or a new glide cancels the slide.
 */
const gliding = new WeakMap();
function glideTo(list, row) {
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  const from = list.scrollTop;
  const to =
    bottom > from + list.clientHeight ? bottom - list.clientHeight : top < from ? top : from;
  cancelAnimationFrame(gliding.get(list));
  const distance = Math.abs(to - from);
  if (!distance || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    list.scrollTop = to;
    return;
  }
  const duration = Math.min(1400, 250 + distance * 0.2);
  const start = performance.now();
  const stop = () => cancelAnimationFrame(gliding.get(list));
  list.addEventListener('wheel', stop, { once: true, passive: true });
  list.addEventListener('touchstart', stop, { once: true, passive: true });
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 0.5 - Math.cos(Math.PI * t) / 2; // ease in and out
    list.scrollTop = from + (to - from) * eased;
    if (t < 1) gliding.set(list, requestAnimationFrame(step));
  };
  gliding.set(list, requestAnimationFrame(step));
}

/**
 * Keyboard search for the country list: type "sing" and the list scrolls to Singapore and marks it,
 * Enter picks it, Up/Down move the mark, Escape closes. Typing pauses for 1s start a new search.
 * It matches the names as shown, so it works in 中文 mode too.
 */
function typeAhead(list, pick, close) {
  const rows = [...list.querySelectorAll('[data-index]')];
  const label = (row) => row.textContent.trim().toLowerCase();
  let query = '';
  let timer = null;
  let active = null;

  const mark = (row) => {
    if (active) active.classList.remove('bg-gray-100');
    active = row;
    if (!row) return;
    row.classList.add('bg-gray-100');
    glideTo(list, row);
  };

  list.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key === 'Enter') {
      e.preventDefault();
      return active && pick(active);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const at = rows.indexOf(active);
      const next = rows[e.key === 'ArrowDown' ? at + 1 : at < 0 ? rows.length - 1 : at - 1];
      return mark(next || active);
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      query = query.slice(0, -1);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      query = query.length || e.key !== ' ' ? query + e.key.toLowerCase() : query;
    } else return;
    clearTimeout(timer);
    timer = setTimeout(() => (query = ''), 1000);
    if (!query) return;
    mark(rows.find((r) => label(r).startsWith(query)) || rows.find((r) => label(r).includes(query)) || active);
  });
}

/**
 * Contact Number field: flag + dial-code adornment, country dropdown, as-you-type formatting
 * and validation with libphonenumber-js (the same library the live site bundles).
 */
export function phoneField(input, { countries, countryIso, onChange }) {
  const lib = window.libphonenumber;
  const trigger = input
    .closest('.MuiInputBase-root')
    .querySelector('[data-action="toggle-country"]');
  const flagBox = trigger.querySelector('[data-bind-html="contact.flagSvg"]');
  const dialEl = input
    .closest('.MuiInputBase-root')
    .querySelector('[data-bind="contact.dialCode"]');
  const arrow = trigger.querySelector('img');
  const host = input.closest('[data-hook~="popup-host"]');
  let iso = countryIso;
  let popup = null;
  let stopDismiss = null;

  const country = () =>
    countries.find((c) => c.iso === iso) || countries.find((c) => c.iso === 'SG');
  const digits = (v) => v.replace(/\D/g, '');
  const formatNational = (v) => new lib.AsYouType(iso).input(digits(v));
  const isValid = (v) => {
    const d = digits(v);
    return d.length > 0 && lib.isValidPhoneNumber(d, iso);
  };

  const field = textField(input, {
    validate: isValid,
    format: formatNational,
    onChange: () => onChange({ countryIso: iso, phone: digits(input.value) }),
  });

  async function setCountry(nextIso) {
    iso = nextIso;
    dialEl.textContent = country().dialCode;
    try {
      flagBox.innerHTML = await (await fetch(`/flags/3x2/${iso}.svg`)).text();
    } catch {
      flagBox.innerHTML = '';
    }
    input.value = formatNational(input.value);
    field.refresh();
    onChange({ countryIso: iso, phone: digits(input.value) });
  }

  function close() {
    if (stopDismiss) stopDismiss();
    if (popup) popup.remove();
    popup = null;
    arrow.classList.remove('is-flipped');
  }

  trigger.addEventListener('click', () => {
    if (popup) return close();
    const named = countries.map((c, i) => ({ ...c, i })).filter((c) => c.name); // live list shows 2 unnamed rows; kept in data, skipped here
    popup = html(countryList(named, iso));
    host.appendChild(popup);
    arrow.classList.add('is-flipped');
    const list = popup.firstElementChild;
    list.querySelectorAll('[data-index]').forEach((row) => {
      row.addEventListener('click', () => {
        setCountry(named[Number(row.dataset.index)].iso);
        close();
        input.focus();
      });
    });
    // Live: the list always opens at the top, even when another country is selected. It only
    // slides (see glideTo) once the guest searches for a country.
    list.focus({ preventScroll: true });
    typeAhead(list, (row) => {
      setCountry(named[Number(row.dataset.index)].iso);
      close();
      input.focus();
    }, close);
    stopDismiss = onDismiss([popup, trigger], close);
  });

  return {
    isValid: () => isValid(input.value),
    setCountry,
    set(phone) {
      field.set(phone ? formatNational(phone) : '');
    },
    /** "+65 9123 4567" for the review page */
    display: (phone, isoCode = iso) => {
      const c = countries.find((x) => x.iso === isoCode);
      return phone
        ? `${c ? c.dialCode : ''} ${new lib.AsYouType(isoCode).input(phone)}`.trim()
        : '';
    },
  };
}

/** MUI checkbox (Terms & Conditions). */
export function checkbox(input, { checked = false, onChange }) {
  const root = input.closest('.MuiCheckbox-root');
  const icon = root.querySelector('.cag-checkbox-icon');
  const render = (on) => {
    root.classList.toggle('Mui-checked', on);
    input.checked = on;
    icon.innerHTML = on ? checkIcon() : '';
  };
  input.addEventListener('change', () => {
    render(input.checked);
    onChange(input.checked);
  });
  render(checked);
  return {
    /** Set the tick from code (reports the change like a click does). */
    set(on) {
      render(on);
      onChange(on);
    },
  };
}
