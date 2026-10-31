/**
 * Step 1 · Trip Details  ·  /booking-details/
 * HTML: views/pages/booking-details/index.html
 *
 * What this page does:
 *   1. Shows the hotel and flight date already chosen, with the flight number left empty to pick again
 *      (the live site does the same when you come back here through "Edit").
 *   2. Updates the flight summary on the right whenever a field changes.
 *   3. Opens and closes the Notes panel.
 *   4. Turns on "Next" once hotel, date and flight are chosen. Pressing it saves the trip and goes to Step 2.
 *
 * Changes are only saved when Next is pressed. Leaving the page keeps the booking as it was.
 */

// Models: data and state
import { api } from '../models/api.js';
import { loadBookingOrGoHome, updateBooking } from '../models/store.js';
import { buildViewModel } from '../models/format.js';
import { nextPageUrl } from '../models/flow.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $, $$, fillBindings } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { createDatePicker, createFlightPicker, createHotelPicker, earliestBookableDate } from '../views/scripts/fields.js';
import { finishLoading } from '../views/scripts/loading.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const booking = await loadBookingOrGoHome(null, config); // Step 1 needs nothing filled in before it
  const hotels = await api.getHotels();
  const nextButton = $('[data-action="next"]');

  // A working copy of the trip for this screen. The flight is cleared so it has to be picked again.
  const trip = {
    hotel: booking.hotel,
    flightDate: booking.flightDate || earliestBookableDate(config.booking),
    flight: null,
  };

  const hotelPicker = createHotelPicker($('[data-field="hotel"]'), {
    hotels,
    onSelect: (hotel) => {
      // Flights depend on the hotel, so a different hotel clears the flight.
      const isDifferentHotel = trip.hotel?.id !== hotel.id;
      if (isDifferentHotel) trip.flight = null;
      trip.hotel = hotel;
      hotelPicker.set(hotel);
      showTrip();
    },
  });

  const datePicker = createDatePicker($('[data-field="flightDate"]'), {
    booking: config.booking,
    onSelect: (date) => {
      // Flights depend on the date too.
      const isDifferentDate = trip.flightDate !== date;
      if (isDifferentDate) trip.flight = null;
      trip.flightDate = date;
      showTrip();
    },
  });

  const flightPicker = createFlightPicker($('[data-field="flight"]'), {
    loadFlights: () => api.getFlights({ hotelId: trip.hotel.id, date: trip.flightDate }),
    onSelect: (flight) => {
      trip.flight = flight;
      showTrip();
    },
  });

  /** Shows the trip in the fields and the summary, and turns the flight field and Next on or off. */
  function showTrip() {
    const hasHotelAndDate = Boolean(trip.hotel && trip.flightDate);
    const hasEverything = Boolean(hasHotelAndDate && trip.flight);

    flightPicker.set(trip.flight);
    flightPicker.setEnabled(hasHotelAndDate); // a flight can only be picked after the hotel and date
    fillBindings(document, buildViewModel({ ...booking, ...trip }, config).values);
    setButtonEnabled(nextButton, hasEverything);
  }

  hotelPicker.set(trip.hotel);
  datePicker.set(trip.flightDate);
  showTrip();
  setUpNotesToggle();

  onPress(nextButton, () => {
    updateBooking((savedBooking) => {
      savedBooking.hotel = trip.hotel;
      savedBooking.flightDate = trip.flightDate;
      savedBooking.flight = trip.flight;
    });
    navigate(nextPageUrl(config, 'tripDetails'));
  });

  finishLoading();
}

/** The arrow on the Notes panel hides or shows every row under the panel's title. */
function setUpNotesToggle() {
  const notesPanel = $('[data-component="notes"]');
  const arrow = $('[data-action="toggle-notes"]');

  arrow.addEventListener('click', () => {
    const isCollapsed = arrow.classList.toggle('is-flipped');
    const rowsUnderTitle = $$(':scope > :not(:first-child)', notesPanel);
    rowsUnderTitle.forEach((row) => (row.hidden = isCollapsed));
  });
}
