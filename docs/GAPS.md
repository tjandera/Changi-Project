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
| 11 | Name validation rule | Live names never turn red (seen on live) | Required (blocks Next) but never red | Backend |
| 12 | Error messages | Live site only turns the label + border red, no text, and only for a wrong phone or email, not an empty field | Same: from the first character typed, red label + border for a phone invalid for the chosen country (libphonenumber) or a malformed email. Empty fields stay neutral | Design |
| 13 | Hotel field typing / search | Not captured | Click-to-pick list only | Design |
| 14 | Notes panel collapse (Step 1) | Collapsed state not captured | Arrow rotates; note rows hide | Design |
| 15 | Odd-sized line label in the summary | Only a standard-luggage booking was captured | "Odd-sized Items" | Design |
| 16 | Terms and Conditions / Privacy Policy links | Documents not in the capture | Dialog: "Not part of this replica" | Legal / content |
| 17 | 中文 language button | The live site runs Google Translate (third-party) | Dictionary-based switch to Simplified Chinese (`data/i18n/zh.json`, `faq.zh.json`). Covers every page, dialog, tooltip, calendar, country list and FAQ. Wording follows the live Google output where the reference screenshot shows it (e.g. 个人信息, 步 3/4) and is written to match elsewhere. Button shows EN while Chinese is on; the choice is remembered across pages. Hotel names use official Chinese names. Text not in the dictionary stays English. Not reviewed by a native speaker | Content: supply approved Chinese copy |
| 18 | Give Feedback tab | Qualtrics survey (third-party) | Tab sized and animated like live (36 x 97 px). Desktop: 400px panel slides in from the right. On phones and tablets (detected by device, not width): pulls up from the bottom with a dimmed backdrop. A narrow desktop window keeps the side panel. Panel body copies what the live frame shows when the survey cannot load: grey page with the broken-page icon; hovering lightens it and shows "This content is blocked. Contact the site owner to fix the issue." (system font, so it renders in the viewer's own UI font as the browser's does). Close X is redrawn in SVG (the live PNG could not be downloaded). Set `feedback.surveyUrl` in `data/config.json` to embed a survey | Content: supply the survey (embed) |
| 19 | Mobile header menu (hamburger) | Menu measured on live at 390px | Full-screen overlay: Home, FAQs, Manage Booking, Book Now, X. The "Off-Airport Check-In" text and the icon both open it. Menu logo is derived from `cag-logo.svg` (live file not reachable); geometry differs in the 4th decimal | Design: confirm logo file |
| 20 | Mobile layouts | Brief is desktop | Compared element by element against live at 1512/1024/768/390 on landing, FAQ, Manage Booking; at 1512/768/390 on Steps 2 and 3. Not compared on live: Steps 1 and 4 below 1512, pickers/calendar/dialogs on mobile | QA |
| 21 | Accessibility | Live site's ARIA not audited | Keyboard support added to div-buttons, dialogs, accordions | QA |
| 22 | Fonts | Site's Lato files not in the zip | Google Fonts Lato under the original filenames; rendered widths matched the live site to 0.1px | — |
| 23 | Two unnamed countries (AC, TA) | Live phone list shows 2 blank rows | Kept in `countries.json`, hidden in the dropdown | — |
| 24 | Analytics (Adobe, Qualtrics) | Third-party tracking | Removed | — |
| 25 | Landing "Book Now" destination | Confirmed on the live site: landing goes straight to Step 2 (Luggage). Step 1 is only reached from the header "Book Now" and "Edit" links. | `flow.landing = "luggage"` in `data/config.json` | — |

Every `ASSUMED` / `INFERRED` value, and the page order, lives in `data/config.json`, so changing a rule never needs a code change.
| 26 | Entrance animation | Live content fades in and slides up 20px (framer-motion) | Not replicated; content is shown at final position | Design |
| 27 | Booking Summary collapse | Measured on live: open at 1024px and wider, collapsed below, reacts live to resizing | Same (`views/summary.js`) | — |
| 28 | "Leave this page?" triggers | Live shows it for header/menu links and for browser Back/Forward onto a booking step. It has no close-tab prompt | Same: header and menu links, plus Back/Forward onto Steps 1 to 4. Continue keeps the booking; Leave clears it and goes to the landing page. Closing or reloading the tab is not intercepted | — |
