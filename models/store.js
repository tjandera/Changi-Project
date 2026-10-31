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
});

export function loadBooking() {
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

export function saveBooking(booking) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(booking));
  } catch {
    /* storage blocked: state lives for this page only */
  }
  return booking;
}

export function updateBooking(mutator) {
  const booking = loadBooking();
  mutator(booking);
  return saveBooking(booking);
}

export function clearBooking() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const isTripComplete = (b) => Boolean(b.hotel && b.flightDate && b.flight);
export const countLuggageItems = (b) => b.luggage.standard + b.luggage.oddSized;
export const isLuggageComplete = (b) => countLuggageItems(b) > 0;
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
 * Loads the booking for a step page, or sends the guest home if an earlier step is missing.
 * Mirrors the live site: open Step 3 without luggage chosen and you land on the home page.
 * Adding ?preview=1 to the URL loads models/data/booking.sample.json instead, so any step can be opened directly.
 *
 * @param {'trip'|'luggage'|'contact'|null} requiredStep  the last step that must already be filled in
 *                                                        (null = nothing required, e.g. Step 1)
 * @returns {Promise<object|null>} the booking, or null when the guest is being sent home
 */
export async function loadBookingOrGoHome(requiredStep, config) {
  const url = new URL(window.location.href);
  if (url.searchParams.has('preview')) {
    const sample = await api.getSampleBooking();
    sample.flightDate = resolveDate(sample.flightDate);
    saveBooking({ ...emptyBooking(), ...sample });
    url.searchParams.delete('preview');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  const booking = loadBooking();
  if (!config.booking.guardSteps || !requiredStep) return booking;
  const ok =
    (requiredStep === 'trip' && isTripComplete(booking)) ||
    (requiredStep === 'luggage' && isTripComplete(booking) && isLuggageComplete(booking)) ||
    (requiredStep === 'contact' && isTripComplete(booking) && isLuggageComplete(booking) && isContactComplete(booking));
  if (!ok) {
    navigate(config.routes.landing, { replace: true });
    return null;
  }
  return booking;
}
