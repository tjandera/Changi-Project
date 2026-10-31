/**
 * Booking state for the 4-step flow, kept in sessionStorage so it survives page loads
 * (each step is its own HTML page, like the live site's routes).
 *
 * Shape:
 * {
 *   hotel:      { id, name } | null
 *   flightDate: "YYYY-MM-DD" | null
 *   flight:     { flightNumber, airline, route, departureTime } | null
 *   luggage:    { standard: number, oddSized: number }
 *   contact:    { firstName, lastName, countryIso, phone, email }
 *   termsAccepted: boolean
 * }
 */
import { api } from './api.js';
import { toISODate } from './format.js';
import { navigate } from './leave.js';

const KEY = 'oaci-replica-booking';

export const emptyBooking = () => ({
  hotel: null,
  flightDate: null,
  flight: null,
  luggage: { standard: 0, oddSized: 0 },
  contact: { firstName: '', lastName: '', countryIso: 'SG', phone: '', email: '' },
  termsAccepted: false,
});

export function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptyBooking();
    const saved = JSON.parse(raw);
    const base = emptyBooking();
    return { ...base, ...saved, luggage: { ...base.luggage, ...saved.luggage }, contact: { ...base.contact, ...saved.contact } };
  } catch {
    return emptyBooking();
  }
}

export function save(booking) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(booking));
  } catch {
    /* storage blocked: state lives for this page only */
  }
  return booking;
}

export function update(mutator) {
  const booking = load();
  mutator(booking);
  return save(booking);
}

export function clear() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const isTripComplete = (b) => Boolean(b.hotel && b.flightDate && b.flight);
export const totalItems = (b) => b.luggage.standard + b.luggage.oddSized;
export const isLuggageComplete = (b) => totalItems(b) > 0;
export const isContactComplete = (b) =>
  Boolean(b.contact.firstName.trim() && b.contact.lastName.trim() && b.contact.phone && b.contact.email);

/** "today+N" in sample data becomes a real date, so previews never show a past flight. */
function resolveDate(value) {
  const m = /^today\+(\d+)$/.exec(value || '');
  if (!m) return value;
  const d = new Date();
  d.setDate(d.getDate() + Number(m[1]));
  return toISODate(d);
}

/**
 * Step guard. Mirrors the live site: a later step opened without the earlier data
 * sends you back to the landing page. ?preview=1 loads data/booking.sample.json instead.
 * @param {'trip'|'luggage'|'contact'|null} requires  what must already be filled in
 */
export async function guard(requires, config) {
  const url = new URL(window.location.href);
  if (url.searchParams.has('preview')) {
    const sample = await api.getSampleBooking();
    sample.flightDate = resolveDate(sample.flightDate);
    save({ ...emptyBooking(), ...sample });
    url.searchParams.delete('preview');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  const booking = load();
  if (!config.booking.guardSteps || !requires) return booking;
  const ok =
    (requires === 'trip' && isTripComplete(booking)) ||
    (requires === 'luggage' && isTripComplete(booking) && isLuggageComplete(booking)) ||
    (requires === 'contact' && isTripComplete(booking) && isLuggageComplete(booking) && isContactComplete(booking));
  if (!ok) {
    navigate(config.routes.landing, { replace: true });
    return null;
  }
  return booking;
}
