/**
 * DATA ADAPTER: the single integration point for backend developers.
 *
 * Every page reads and writes data ONLY through the functions below.
 * Today they read static JSON from /data so the UI runs with no server logic.
 * To connect a real backend, replace the body of a function with a fetch() to
 * your endpoint and return the same shape. No page or component needs to change.
 *
 * Shapes are documented in docs/INTEGRATION.md and shown by the JSON files in /data.
 */

const DATA_BASE = '/data';
const cache = new Map();

async function getJSON(file) {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(`${DATA_BASE}/${file}`).then((res) => {
        if (!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
        return res.json();
      }),
    );
  }
  return cache.get(file);
}

export const api = {
  /** UI configuration: currency, prices, booking window, routes, tooltip and dialog copy. */
  async getConfig() {
    return getJSON('config.json');
  },

  /**
   * Partner hotels for the Location / Hotel dropdowns.
   * @returns {Promise<Array<{id: string, name: string}>>}
   */
  async getHotels() {
    return (await getJSON('hotels.json')).hotels;
  },

  /**
   * Eligible departures for a hotel on a date.
   * Live site: loads per hotel + date from CAG's API. Replica: same list for every date.
   * @param {{hotelId: string, date: string}} query  date is ISO "YYYY-MM-DD"
   * @returns {Promise<{airlines: Object<string,{name:string,logo:string}>, flights: Array<{flightNumber:string, airline:string, route:string, departureTime:string}>}>}
   */
  // eslint-disable-next-line no-unused-vars
  async getFlights({ hotelId, date }) {
    const data = await getJSON('flights.json');
    return { airlines: data.airlines, flights: data.flights };
  },

  /** Phone country list: {defaultIso, countries: [{iso, name, dialCode}]}. */
  async getCountries() {
    return getJSON('countries.json');
  },

  /** FAQ tabs: [{label, items: [{question, answerHtml} | {question, answer: {raw}}]}]. */
  async getFaq(lang = 'en') {
    return (await getJSON(lang === 'en' ? 'faq.json' : `i18n/faq.${lang}.json`)).tabs;
  },

  /** Page text dictionary for a language: {strings, patterns, dateFormat} (see models/i18n.js). */
  async getTranslations(lang) {
    return getJSON(`i18n/${lang}.json`);
  },

  /** Placeholder booking used by ?preview=1. */
  async getSampleBooking() {
    return structuredClone(await getJSON('booking.sample.json'));
  },

  /**
   * WRITE, mocked. Live site: creates the booking, then redirects to the payment provider.
   * Replace with: POST /bookings -> { bookingId, paymentUrl }
   * @param {object} booking  see store.js for the shape
   */
  // eslint-disable-next-line no-unused-vars
  async submitBooking(booking) {
    return { ok: true, mocked: true, bookingId: null, paymentUrl: null };
  },

  /**
   * READ, mocked. Live site: looks up a booking by confirmation code + 6-character PIN.
   * Replace with: POST /bookings/lookup { code, pin } -> { booking }
   */
  // eslint-disable-next-line no-unused-vars
  async retrieveBooking({ code, pin }) {
    return { ok: false, mocked: true, booking: null };
  },
};
