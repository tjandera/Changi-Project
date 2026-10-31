/** Landing page: hero booking card (rendered twice, desktop + mobile; kept in sync). */
import { api } from '../models/api.js';
import { $, $$ } from '../views/dom.js';
import { setEnabled, onPress } from '../views/button.js';
import { wireAccordion, findItem } from '../views/accordion.js';
import { dateField, earliestDate, flightField, hotelField } from '../views/fields.js';
import { load, save } from '../models/store.js';
import { nextRoute } from '../models/flow.js';
import { navigate } from '../models/leave.js';
import { boot, fail } from './boot.js';

try {
  const config = await boot();
  const hotels = await api.getHotels();
  const state = { hotel: null, flightDate: earliestDate(config.booking), flight: null };
  const cards = $$('[data-component="booking-card"]').map((card) => ({ card }));

  const sync = () => {
    cards.forEach(({ hotel, date, flight, button }) => {
      hotel.set(state.hotel);
      date.set(state.flightDate);
      flight.set(state.flight);
      flight.setEnabled(Boolean(state.hotel && state.flightDate));
      setEnabled(button, Boolean(state.hotel && state.flightDate && state.flight));
    });
  };

  cards.forEach((c) => {
    c.hotel = hotelField($('[data-field="hotel"]', c.card), {
      hotels,
      onSelect: (h) => {
        if (state.hotel?.id !== h.id) state.flight = null;
        state.hotel = h;
        sync();
      },
    });
    c.date = dateField($('[data-field="flightDate"]', c.card), {
      booking: config.booking,
      onSelect: (iso) => {
        if (state.flightDate !== iso) state.flight = null;
        state.flightDate = iso;
        sync();
      },
    });
    c.flight = flightField($('[data-field="flight"]', c.card), {
      loadFlights: () => api.getFlights({ hotelId: state.hotel.id, date: state.flightDate }),
      onSelect: (f) => {
        state.flight = f;
        sync();
      },
    });
    c.button = $('[data-action="book-now"]', c.card);
    onPress(c.button, () => {
      // Only the schedule changes; luggage (Step 2) and contact (Step 3) already entered are kept.
      save({ ...load(), ...state });
      navigate(nextRoute(config, 'landing'));
    });
  });
  sync();

  // Landing FAQ block: same accordion as /faq, answers from data/faq.json
  const faq = await api.getFaq();
  $$('main .flex.flex-col.cursor-pointer.border-b').forEach((row) => {
    const item = findItem(faq, row.querySelector('p').textContent);
    if (item) wireAccordion(row, item);
  });
} catch (err) {
  fail(err);
}
