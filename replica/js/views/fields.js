/**
 * Trip fields used on the landing card and Step 1: Hotel/Location dropdown,
 * react-calendar date picker and Flight Number dropdown.
 */
import { html, onDismiss } from './dom.js';
import { displayDate, fromISODate, toISODate } from '../models/format.js';
import { calendar, flightList, hotelList } from './templates.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Container the live site appends a field's popup to. */
const popupHost = (input) => input.parentElement.parentElement.closest('.relative.w-full, .relative.inline-block') || input.parentElement.parentElement;

function attachPopup(input, markup, onPick, extraKeep = []) {
  closeAll();
  const host = popupHost(input);
  const popup = html(markup);
  host.appendChild(popup);
  popup.querySelectorAll('[data-index]').forEach((row) => {
    row.addEventListener('mousedown', (e) => e.preventDefault());
    row.addEventListener('click', () => {
      onPick(Number(row.dataset.index));
      close();
    });
  });
  const stop = onDismiss([popup, input, ...extraKeep], () => close());
  function close() {
    stop();
    popup.remove();
    input.blur();
    openPopup = null;
    openFor = null;
  }
  openPopup = close;
  openFor = input;
  return popup;
}

let openPopup = null;
let openFor = null;
export function closeAll() {
  if (openPopup) openPopup();
}

/** Hotel / Location dropdown. */
export function hotelField(input, { hotels, onSelect }) {
  const open = () => {
    if (openFor === input) return closeAll();
    attachPopup(input, hotelList(input.offsetWidth, hotels.map((h) => h.name)), (i) => onSelect(hotels[i]));
  };
  input.addEventListener('click', open);
  input.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === 'ArrowDown') && open());
  return { set: (hotel) => (input.value = hotel ? hotel.name : '') };
}

/** Flight Number dropdown. Disabled until a hotel and date are chosen (live behaviour). */
const FLIGHT_ON =
  'w-full h-[36px] rounded-[8px] border pl-3 pr-10  focus:border-[#7a35b0] focus:ring-4 focus:ring-[#ece0f5] focus:outline-none focus:border-2 bg-white border-[#CCCCCC] cursor-pointer';
const FLIGHT_OFF = 'w-full h-[36px] rounded-[8px] border pl-3 pr-10  focus:outline-none bg-[#F7F7F7] border-[#E5E5E5] cursor-not-allowed';

export function flightField(input, { loadFlights, onSelect }) {
  const icon = input.parentElement.querySelector('img');
  let enabled = !input.disabled;
  const setEnabled = (on) => {
    enabled = on;
    input.className = on ? FLIGHT_ON : FLIGHT_OFF;
    input.disabled = !on;
    input.placeholder = on ? '' : 'Select hotel and flight date first';
    if (icon) icon.src = on ? '/icons/arrow-dropdown.svg' : '/icons/arrow-down-disabled.svg';
  };
  input.addEventListener('click', async () => {
    if (!enabled) return;
    if (openFor === input) return closeAll();
    const { flights, airlines } = await loadFlights();
    attachPopup(input, flightList(input.offsetWidth, flights, airlines), (i) => onSelect(flights[i]));
  });
  return {
    setEnabled,
    set: (flight) => (input.value = flight ? flight.flightNumber : ''),
  };
}

/**
 * First bookable date. FAQ: "up to 14 days before and no later than 11am on the day of your flight",
 * so after the cut-off hour the earliest date is tomorrow. (Inferred; the live rule runs server-side.)
 */
export function earliestDate({ sameDayCutoffHour }, now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (now.getHours() >= sameDayCutoffHour) d.setDate(d.getDate() + 1);
  return toISODate(d);
}

/** react-calendar month view. Selectable range: earliestDate .. today + advanceDays. */
export function dateField(input, { booking, onSelect }) {
  let shown = null; // first day of the month on screen
  let value = null; // ISO

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstBookable = fromISODate(earliestDate(booking));
  const last = new Date(today);
  last.setDate(last.getDate() + booking.advanceDays);

  function days(month) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(monthStart);
    start.setDate(1 - ((monthStart.getDay() + 6) % 7)); // Monday-first grid
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
    const out = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = toISODate(d);
      const neighbor = d.getMonth() !== month.getMonth();
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = +d === +today;
      const active = iso === value;
      const cls = [
        'react-calendar__tile',
        isToday && 'react-calendar__tile--now',
        active && 'react-calendar__tile--active react-calendar__tile--range react-calendar__tile--rangeStart react-calendar__tile--rangeEnd react-calendar__tile--rangeBothEnds',
        'react-calendar__month-view__days__day',
        weekend && 'react-calendar__month-view__days__day--weekend',
        neighbor && 'react-calendar__month-view__days__day--neighboringMonth',
      ].filter(Boolean).join(' ');
      out.push({
        iso,
        day: d.getDate(),
        classes: cls,
        disabled: neighbor || d < firstBookable || d > last,
        ariaLabel: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
      });
    }
    return out;
  }

  function render() {
    const label = `${MONTH_NAMES[shown.getMonth()]} ${shown.getFullYear()}`;
    const todayWeekday = (new Date().getDay() + 6) % 7;
    const popup = attachPopup(input, calendar(label, days(shown), todayWeekday), () => {});
    popup.querySelectorAll('[data-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        value = btn.dataset.date;
        input.value = displayDate(value);
        closeAll();
        onSelect(value);
      });
    });
    popup.querySelectorAll('[data-cal]').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        shown = new Date(shown.getFullYear(), shown.getMonth() + (btn.dataset.cal === 'next' ? 1 : -1), 1);
        render();
        input.focus();
      });
    });
  }

  input.addEventListener('click', () => {
    const base = value ? fromISODate(value) : today;
    shown = new Date(base.getFullYear(), base.getMonth(), 1);
    render();
  });

  return {
    set: (iso) => {
      value = iso;
      input.value = iso ? displayDate(iso) : '';
    },
  };
}
