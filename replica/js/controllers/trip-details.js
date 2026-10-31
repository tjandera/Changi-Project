/** Step 1 · Trip Details: hotel, flight date, flight number, flight time. */
import { api } from '../models/api.js';
import { $, $$, bind } from '../views/dom.js';
import { setEnabled, onPress } from '../views/button.js';
import { dateField, earliestDate, flightField, hotelField } from '../views/fields.js';
import { viewModel } from '../models/format.js';
import { guard, update } from '../models/store.js';
import { nextRoute } from '../models/flow.js';
import { navigate } from '../models/leave.js';
import { endLoading } from '../views/loading.js';
import { boot, fail } from './boot.js';

try {
  const config = await boot();
  const booking = await guard(null, config);
  const hotels = await api.getHotels();
  // Live behaviour (31 Oct 2026): Step 1 is reached through Edit, and it opens with the hotel and date
  // kept but the flight number and flight time empty ("-"), so a flight must be picked again.
  // Only this screen is cleared; the saved booking is untouched until Next is pressed.
  booking.flight = null;
  const next = $('[data-action="next"]');

  const refresh = () => {
    flight.set(booking.flight);
    flight.setEnabled(Boolean(booking.hotel && booking.flightDate));
    bind(document, viewModel(booking, config).values);
    setEnabled(next, Boolean(booking.hotel && booking.flightDate && booking.flight));
  };

  const hotel = hotelField($('[data-field="hotel"]'), {
    hotels,
    onSelect: (h) => {
      if (booking.hotel?.id !== h.id) booking.flight = null;
      booking.hotel = h;
      hotel.set(h);
      refresh();
    },
  });
  if (!booking.flightDate) booking.flightDate = earliestDate(config.booking);
  const date = dateField($('[data-field="flightDate"]'), {
    booking: config.booking,
    onSelect: (iso) => {
      if (booking.flightDate !== iso) booking.flight = null;
      booking.flightDate = iso;
      refresh();
    },
  });
  const flight = flightField($('[data-field="flight"]'), {
    loadFlights: () => api.getFlights({ hotelId: booking.hotel.id, date: booking.flightDate }),
    onSelect: (f) => {
      booking.flight = f;
      refresh();
    },
  });

  hotel.set(booking.hotel);
  date.set(booking.flightDate);
  refresh();

  // Notes panel collapses with its arrow (arrow rotates like the live site's transition-transform icon).
  const notes = $('[data-component="notes"]');
  const arrow = $('[data-action="toggle-notes"]');
  arrow.addEventListener('click', () => {
    const collapsed = arrow.classList.toggle('is-flipped');
    $$(':scope > :not(:first-child)', notes).forEach((row) => (row.hidden = collapsed));
  });

  onPress(next, () => {
    update((b) => {
      b.hotel = booking.hotel;
      b.flightDate = booking.flightDate;
      b.flight = booking.flight;
    });
    navigate(nextRoute(config, 'tripDetails'));
  });
  endLoading();
} catch (err) {
  fail(err);
}
