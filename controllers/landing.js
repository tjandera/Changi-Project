/**
 * Landing page  ·  /
 * HTML: views/pages/landing/index.html
 *
 * What this page does:
 *   1. Sets up the booking card: Location (hotel), Departure Date and Departure Flight Number.
 *      The card is in the HTML twice (desktop and phone layouts). Both always show the same choices.
 *   2. Turns on "Book Now" once all three are chosen. Pressing it saves the trip and goes to Step 2 (Luggage).
 *   3. Makes the FAQ questions at the bottom of the page open and close.
 */

// Models: data and state
import { api } from '../models/api.js';
import { loadBooking, saveBooking } from '../models/store.js';
import { nextPageUrl } from '../models/flow.js';
import { navigate } from '../models/leave.js';
// Views: what the user sees
import { $, $$ } from '../views/scripts/dom.js';
import { onPress, setButtonEnabled } from '../views/scripts/button.js';
import { createDatePicker, createFlightPicker, createHotelPicker, earliestBookableDate } from '../views/scripts/fields.js';
import { findFaqItem, setUpAccordion } from '../views/scripts/accordion.js';
// Start-up shared by every page
import { showPageError, startPage } from './boot.js';

showPage().catch(showPageError);

async function showPage() {
  const config = await startPage();
  const hotels = await api.getHotels();

  // What the guest has chosen so far. Both booking cards read from this one object.
  const choice = {
    hotel: null,
    flightDate: earliestBookableDate(config.booking),
    flight: null,
  };

  const cards = $$('[data-component="booking-card"]').map((cardElement) =>
    setUpBookingCard(cardElement, { config, hotels, choice, onChange: showChoiceOnEveryCard }),
  );

  function showChoiceOnEveryCard() {
    cards.forEach((card) => showChoice(card, choice));
  }

  showChoiceOnEveryCard();
  await setUpFaqQuestions();
}

/** Connects one booking card's three fields and its Book Now button to the shared `choice`. */
function setUpBookingCard(cardElement, { config, hotels, choice, onChange }) {
  const hotelPicker = createHotelPicker($('[data-field="hotel"]', cardElement), {
    hotels,
    onSelect: (hotel) => {
      // Flights depend on the hotel, so a different hotel clears the flight.
      const isDifferentHotel = choice.hotel?.id !== hotel.id;
      if (isDifferentHotel) choice.flight = null;
      choice.hotel = hotel;
      onChange();
    },
  });

  const datePicker = createDatePicker($('[data-field="flightDate"]', cardElement), {
    booking: config.booking,
    onSelect: (date) => {
      // Flights depend on the date too.
      const isDifferentDate = choice.flightDate !== date;
      if (isDifferentDate) choice.flight = null;
      choice.flightDate = date;
      onChange();
    },
  });

  const flightPicker = createFlightPicker($('[data-field="flight"]', cardElement), {
    loadFlights: () => api.getFlights({ hotelId: choice.hotel.id, date: choice.flightDate }),
    onSelect: (flight) => {
      choice.flight = flight;
      onChange();
    },
  });

  const bookNowButton = $('[data-action="book-now"]', cardElement);
  onPress(bookNowButton, () => {
    // Keep any luggage (Step 2) and contact details (Step 3) entered earlier. Only the trip changes.
    saveBooking({ ...loadBooking(), ...choice });
    navigate(nextPageUrl(config, 'landing'));
  });

  return { hotelPicker, datePicker, flightPicker, bookNowButton };
}

/** Shows the current choice on one card and turns its fields and button on or off. */
function showChoice(card, choice) {
  const hasHotelAndDate = Boolean(choice.hotel && choice.flightDate);
  const hasEverything = Boolean(hasHotelAndDate && choice.flight);

  card.hotelPicker.set(choice.hotel);
  card.datePicker.set(choice.flightDate);
  card.flightPicker.set(choice.flight);
  card.flightPicker.setEnabled(hasHotelAndDate); // a flight can only be picked after the hotel and date
  setButtonEnabled(card.bookNowButton, hasEverything);
}

/** The FAQ questions on this page use the same answers as the FAQ page (models/data/faq.json). */
async function setUpFaqQuestions() {
  const faqTabs = await api.getFaq();
  $$('main .faq-item').forEach((questionRow) => {
    const questionText = questionRow.querySelector('p').textContent;
    const faqItem = findFaqItem(faqTabs, questionText);
    if (faqItem) setUpAccordion(questionRow, faqItem);
  });
}
