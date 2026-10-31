/** Display formatting. Output strings match what the live site renders. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-11-01" -> "01 Nov 2026" (the live site pads the day) */
export function displayDate(iso) {
  if (!iso) return '';
  const d = fromISODate(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 29 -> "29.00" */
export const money = (n) => Number(n).toFixed(2);

/** 1 -> "1 item(s)" */
export const itemsLabel = (n) => `${n} item(s)`;

/**
 * Turns the booking into the flat key/value map the pages bind with data-bind="key".
 * Adding a new bound value = add a key here + a data-bind attribute in the HTML.
 */
export function viewModel(booking, config, extras = {}) {
  const { flight, flightDate, hotel, luggage, contact } = booking;
  const price = config.pricing;
  const lines = [
    { key: 'standard', label: 'Standard Luggage', count: luggage.standard, unit: price.standardLuggage },
    { key: 'oddSized', label: 'Odd-sized Items', count: luggage.oddSized, unit: price.oddSizedItem },
  ].map((l) => ({ ...l, subtotal: money(l.count * l.unit), itemsLabel: itemsLabel(l.count) }));
  const totalCount = luggage.standard + luggage.oddSized;
  const totalCost = lines.reduce((sum, l) => sum + l.count * l.unit, 0);

  return {
    lines: lines.filter((l) => l.count > 0),
    allLines: lines,
    values: {
      currency: config.currency,
      'trip.hotel': hotel ? hotel.name : '',
      'trip.flightSummary': flight
        ? `${flight.flightNumber} · ${displayDate(flightDate)} · ${flight.departureTime} ${config.timezoneLabel}`
        : '',
      'trip.flightTime': flight ? `${flight.departureTime} (${config.timezoneLabel})` : '-',
      'luggage.totalItemsLabel': itemsLabel(totalCount),
      'luggage.totalCost': money(totalCost),
      'contact.fullName': `${contact.firstName} ${contact.lastName}`.trim(),
      'contact.phoneDisplay': extras.phoneDisplay || '',
      'contact.email': contact.email,
      'contact.dialCode': extras.dialCode || '',
    },
  };
}
