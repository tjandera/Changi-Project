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
 * Outlined text field. Errors show after the first blur, then update live (as on the live site).
 * @param {HTMLInputElement} input
 * @param {{validate?: (v:string)=>boolean, format?: (v:string)=>string, onChange?: (v:string)=>void}} opts
 */
export function textField(input, { validate = (v) => v.trim() !== '', format, onChange } = {}) {
  const root = input.closest('.MuiInputBase-root');
  const label = input.closest('.relative.flex.flex-col')?.querySelector('p');
  let touched = false;

  const showError = (on) => {
    root.classList.toggle('Mui-error', on);
    input.setAttribute('aria-invalid', String(on));
    if (label) label.style.color = on ? LABEL_ERROR : LABEL_OK;
  };
  const refresh = () => showError(touched && !validate(input.value));

  input.addEventListener('focus', () => root.classList.add('Mui-focused'));
  input.addEventListener('blur', () => {
    root.classList.remove('Mui-focused');
    if (input.value !== '') touched = true;
    refresh();
  });
  input.addEventListener('input', () => {
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
 * Contact Number field: flag + dial-code adornment, country dropdown, as-you-type formatting
 * and validation with libphonenumber-js (the same library the live site bundles).
 */
export function phoneField(input, { countries, countryIso, onChange }) {
  const lib = window.libphonenumber;
  const trigger = input.closest('.MuiInputBase-root').querySelector('[data-action="toggle-country"]');
  const flagBox = trigger.querySelector('[data-bind-html="contact.flagSvg"]');
  const dialEl = input.closest('.MuiInputBase-root').querySelector('[data-bind="contact.dialCode"]');
  const arrow = trigger.querySelector('img');
  const host = input.closest('.relative.inline-block');
  let iso = countryIso;
  let popup = null;
  let stopDismiss = null;

  const country = () => countries.find((c) => c.iso === iso) || countries.find((c) => c.iso === 'SG');
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
    arrow.classList.remove('rotate-180');
  }

  trigger.addEventListener('click', () => {
    if (popup) return close();
    const named = countries.map((c, i) => ({ ...c, i })).filter((c) => c.name); // live list shows 2 unnamed rows; kept in data, skipped here
    popup = html(countryList(named, iso));
    host.appendChild(popup);
    arrow.classList.add('rotate-180');
    const list = popup.firstElementChild;
    list.querySelectorAll('[data-index]').forEach((row) => {
      row.addEventListener('click', () => {
        setCountry(named[Number(row.dataset.index)].iso);
        close();
        input.focus();
      });
    });
    const selected = list.querySelector('.bg-gray-50');
    if (selected) list.scrollTop = selected.offsetTop - 80;
    list.focus({ preventScroll: true });
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
      return phone ? `${c ? c.dialCode : ''} ${new lib.AsYouType(isoCode).input(phone)}`.trim() : '';
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
}
