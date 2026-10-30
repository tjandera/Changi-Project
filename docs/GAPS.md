# Requirement gaps

What the capture could not provide, what this replica does instead, and who needs to fill it.

| # | Gap | Why it is a gap | Replica default | Owner |
|---|---|---|---|---|
| 1 | **How It Works column widths** | In Chrome the live markup sizes the 5 columns by text length (189/281/215/184/251 px). The brief's reference screenshot shows 5 equal 224px columns. | Pinned to equal columns (1 CSS rule in `replica.css`) so the page matches the screenshot exactly. Delete the rule to get the live Chrome layout. | Design: confirm which is intended |
| 2 | Booking creation + payment | CAG backend and payment provider | `submitBooking` mocked; "End of replica flow" dialog | Backend |
| 3 | Confirmation + Booking Details pages | Only reachable after a paid booking; not in the zip | Not built | Design: supply screens |
| 4 | Manage Booking lookup | Needs CAG booking API | `retrieveBooking` mocked; dialog explains | Backend |
| 5 | Flights per hotel + date | Live list comes from an API per hotel/date | Same 10 SQ departures (captured 30 Oct 2026) for every date | Backend |
| 6 | Airline logo in the flight list | Served from CAG's CDN, blocked cross-origin | `/images/singapore-airlines.png` (from the zip) at 16px | Design |
| 7 | Odd-sized item price | Not shown on the live page | S$29, same as standard (`config.pricing.oddSizedItem`) | Business |
| 8 | Max items per type | Not shown | 10 (`config.booking.maxItemsPerType`) | Business |
| 9 | Earliest bookable date | Rule runs server-side | Inferred from the FAQ: today until 11:00, then tomorrow; up to 14 days ahead | Business |
| 10 | Email validation rule | Not visible | Standard `name@domain.tld` check | Backend |
| 11 | Name validation rule | Not visible | Required, non-blank | Backend |
| 12 | Error messages | Live site only turns the label + border red, no text | Same: red label + border, no text | Design |
| 13 | Hotel field typing / search | Not captured | Click-to-pick list only | Design |
| 14 | Notes panel collapse (Step 1) | Collapsed state not captured | Arrow rotates; note rows hide | Design |
| 15 | Odd-sized line label in the summary | Only a standard-luggage booking was captured | "Odd-sized Items" | Design |
| 16 | Terms and Conditions / Privacy Policy links | Documents not in the capture | Dialog: "Not part of this replica" | Legal / content |
| 17 | 中文 language button | Uses Google Translate (third-party) | Visual only | Out of scope |
| 18 | Give Feedback tab | Qualtrics survey (third-party) | Visual only | Out of scope |
| 19 | Mobile header menu (hamburger) | Menu not captured | Visual only | Design |
| 20 | Mobile layouts | Brief is desktop; markup keeps the site's responsive classes | Responsive classes intact, not QA'd below 1280px | QA |
| 21 | Accessibility | Live site's ARIA not audited | Keyboard support added to div-buttons, dialogs, accordions | QA |
| 22 | Fonts | Site's Lato files not in the zip | Google Fonts Lato under the original filenames; rendered widths matched the live site to 0.1px | — |
| 23 | Two unnamed countries (AC, TA) | Live phone list shows 2 blank rows | Kept in `countries.json`, hidden in the dropdown | — |
| 24 | Analytics (Adobe, Qualtrics) | Third-party tracking | Removed | — |
| 25 | Landing "Book Now" destination | Set by the project owner: landing goes straight to Step 2 (Luggage). The Step 1 page is only reached from the header "Book Now" and "Edit" links. The zip does not show where the live landing card sends users. | `flow.landing = "luggage"` in `data/config.json` | Product: confirm |

Every `ASSUMED` / `INFERRED` value, and the page order, lives in `data/config.json`, so changing a rule never needs a code change.
