/**
 * Markup the live site renders at runtime (dropdowns, calendar, dialogs, tooltips).
 * Each template was captured from the live DOM on 30 Oct 2026 and is reused verbatim;
 * only the dynamic text/values are parameterised.
 */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* Hotel / Location dropdown (open state) */
export const hotelList = (width, names) =>
  `<div class="absolute z-50 mt-2 bg-white shadow-lg rounded-lg max-h-[218px] overflow-y-auto" style="width: ${width}px;">${names
    .map(
      (n, i) =>
        `<div class="cursor-pointer hover:bg-gray-100 px-4 py-2 w-full" data-index="${i}"><p class="type-body-l-regular ink-black">${esc(n)}</p></div>`,
    )
    .join('')}</div>`;

/* Flight Number dropdown (open state) */
export const flightList = (width, flights, airlines) =>
  `<div class="absolute z-50 mt-2 bg-white shadow-lg rounded-lg max-h-[218px] overflow-y-auto" style="width: ${width}px;">${flights
    .map(
      (f, i) =>
        `<div class="cursor-pointer hover:bg-gray-100 w-full" data-index="${i}"><div class="bg-white flex flex-row gap-[4px] p-[12px] border-b border-[#CCCCCC]"><div class="w-[207px] flex flex-col gap-[4px]"><div class="flex flex-row gap-[4px] items-center"><img alt="Logo" loading="lazy" width="16" height="16" decoding="async" data-nimg="1" class="rounded-full bg-white next-img" src="${esc(airlines[f.airline]?.logo || '')}"><p class="type-body-l-black ink-black">${esc(f.flightNumber)}</p></div><p class="type-body-s-bold ink-black">${esc(f.route)}</p></div><div class="w-[44px] flex flex-col"><p class="type-small-regular ink-black">Departs</p><p class="type-body-s-black ink-black">${esc(f.departureTime)}</p></div></div></div>`,
    )
    .join('')}</div>`;

/* Phone country dropdown (open state); selected row is bold purple on bg-gray-50 */
export const countryList = (countries, selectedIso) =>
  `<div class="pt-[8px] relative"><div class="absolute z-50 mt-2 w-full bg-white shadow-lg rounded-lg max-h-[218px] overflow-y-auto outline-none focus:outline-none" tabindex="0">${countries
    .map((c, i) => {
      const sel = c.iso === selectedIso;
      return `<div class="cursor-pointer px-4 py-2 hover:bg-gray-100 ${sel ? 'bg-gray-50' : ''}" data-index="${i}"><p class="${sel ? 'type-body-l-bold ink-purple' : 'type-body-l-regular ink-black'}">${esc(c.name)}</p></div>`;
    })
    .join('')}</div></div>`;

/* Tooltip shown on the info icons */
export const tooltip = (text) =>
  `<div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-[8px] px-[12px] py-[8px] bg-black shadow-lg z-50 text-center" style="width: 261px;"><p class="type-body-s-bold ink-white">${esc(text)}</p></div>`;

/* react-calendar date picker (open state) */
const WEEKDAYS = [
  ['Monday', 'Mo'], ['Tuesday', 'Tu'], ['Wednesday', 'We'], ['Thursday', 'Th'],
  ['Friday', 'Fr'], ['Saturday', 'Sa'], ['Sunday', 'Su'],
];
const CELL = 'flex: 0 0 14.2857%; overflow: hidden; margin-inline-end: 0px;';
export const calendar = (monthLabel, days, todayWeekday) =>
  `<div class="
            absolute z-50 mt-2 bg-white shadow-lg rounded-lg
            sm:w-auto sm:max-w-none sm:left-0 sm:translate-x-0
            w-[90vw] max-w-sm left-1/2 -translate-x-1/2
        "><div class="flex justify-between items-center pt-[16px] px-[16px]"><div class="px-[16px] py-[11px] min-w-[93px] h-[40px] rounded-[8px] border border-[#ABABAB] flex items-center justify-center"><p class="type-body-s-bold ink-grey">${monthLabel}</p></div><div class="flex flex-row"><button data-cal="prev"><img alt="Previous" loading="lazy" width="40" height="40" decoding="async" data-nimg="1" class="cursor-pointer next-img" src="/icons/previous-calendar.svg"></button><button data-cal="next"><img alt="Next" loading="lazy" width="40" height="40" decoding="async" data-nimg="1" class="cursor-pointer next-img" src="/icons/next-calendar.svg"></button></div></div><div class="react-calendar !border-0"><div class="react-calendar__viewContainer"><div class="react-calendar__month-view"><div style="display: flex; align-items: flex-end;"><div style="flex-grow: 1; width: 100%;"><div class="react-calendar__month-view__weekdays" style="display: flex; flex-wrap: nowrap;">${WEEKDAYS.map(
    ([full, short], i) =>
      `<div class="react-calendar__month-view__weekdays__weekday${i === todayWeekday ? ' react-calendar__month-view__weekdays__weekday--current' : ''}${i > 4 ? ' react-calendar__month-view__weekdays__weekday--weekend' : ''}" style="${CELL}"><abbr aria-label="${full}" title="${full}">${short}</abbr></div>`,
  ).join('')}</div><div class="react-calendar__month-view__days" style="display: flex; flex-wrap: wrap;">${days
    .map(
      (d) =>
        `<button class="${d.classes}"${d.disabled ? ' disabled=""' : ''} type="button" style="${CELL}" data-date="${d.iso}"><abbr aria-label="${d.ariaLabel}">${d.day}</abbr></button>`,
    )
    .join('')}</div></div></div></div></div></div></div>`;

/* MUI Dialog shell + "Leave this page?" body. Reused for the replica's own notices. */
export const confirmDialog = ({ title, body, primary, secondary, icon = true }) =>
  `<div role="presentation" data-testid="CagDialog" class="MuiDialog-root cag-dialog MuiModal-root css-1ei1ro4"><div aria-hidden="true" class="MuiBackdrop-root MuiModal-backdrop css-919eu4" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);"></div><div tabindex="0" data-testid="sentinelStart"></div><div class="MuiDialog-container MuiDialog-scrollPaper css-ekeie0" role="presentation" tabindex="-1" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);"><div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm css-uhb5lp" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="MuiBox-root css-19kzrtu"><div class="relative flex flex-col items-center pt-[12px]"><div class="flex flex-col gap-[16px] items-center justify-center w-[297px] md:w-[336px] px-[12px] md:p-0"><div class="flex flex-col items-center justify-center gap-[4px]"><h6 class="type-h6-black ink-black">${esc(title)}</h6><p class="type-body-s-regular text-center ink-grey">${esc(body)}</p></div><div data-dialog="primary" class="rounded-[60px] flex items-center justify-center border transition-colors duration-200 bg-black border-black cursor-pointer" style="width: 200px; height: 40px; box-shadow: rgba(18, 18, 18, 0.05) 0px 1px 2px 0px;"><p class="type-body-s-bold ink-white">${esc(primary)}</p></div>${secondary ? `<div data-dialog="secondary" class="cursor-pointer"><p class="type-body-s-bold ink-purple">${esc(secondary)}</p></div>` : ''}</div>${icon ? '<img alt="Info" loading="lazy" width="50" height="50" decoding="async" data-nimg="1" class="fixed top-[calc(50%-135px)] left-1/2 -translate-x-1/2 z-[9999] next-img" src="/icons/something-wrong.svg">' : ''}</div></div></div></div><div tabindex="0" data-testid="sentinelEnd"></div></div>`;

/* "Odd-sized items" information dialog (Step 2) */
export const oddSizedDialog = () =>
  `<div role="presentation" data-testid="CagDialog" class="MuiDialog-root cag-dialog MuiModal-root css-1ei1ro4"><div aria-hidden="true" class="MuiBackdrop-root MuiModal-backdrop css-919eu4" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);"></div><div tabindex="0" data-testid="sentinelStart"></div><div class="MuiDialog-container MuiDialog-scrollPaper css-ekeie0" role="presentation" tabindex="-1" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);"><div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm css-uhb5lp" role="dialog" aria-modal="true" aria-label="Odd-sized items"><div class="MuiBox-root css-19kzrtu"><div class="max-w-[327px] mx-auto"><div class="w-full flex flex-row pb-[24px] items-center justify-end"><img data-dialog="close" alt="Odd Sized" loading="lazy" width="24" height="24" decoding="async" data-nimg="1" class="cursor-pointer next-img" src="/icons/odd-sized-close.svg"></div><div class="flex flex-col gap-[24px] items-center justify-center"><img alt="Odd Sized" loading="lazy" width="139.49" height="67.92" decoding="async" data-nimg="1" class="next-img" src="/icons/odd-sized-item-modal.svg"><div class="flex flex-col gap-[4px]"><p class="type-body-l-bold ink-black">Odd-sized items</p><p class="type-body-s-regular ink-grey">Large or heavy items, such as sports equipment or musical instruments. Odd-sized luggage should not exceed 200cm (length) x 75cm (width) x 80cm (height) in dimension.<br><br>Refer to your airline's luggage guidelines for more information on odd-sized luggage.</p></div></div></div></div></div></div><div tabindex="0" data-testid="sentinelEnd"></div></div>`;

/* FAQ answer block (open accordion) */
/* The answer is a div, not a p: a <ul> inside a <p> is closed out of it by the HTML parser, so the list would lose the 14/18 body text. */
export const faqAnswer = (item) =>
  item.answer && item.answer.raw
    ? `<div class="pb-[16px]">${item.answer.raw}</div>`
    : `<div class="pb-[16px]"><div class="type-body-s-regular ink-black">${item.answerHtml}</div></div>`;

/* Material checkbox tick (IcoMoon "core-checkbox-check-solid", from the site bundle) */
export const checkIcon = () =>
  '<span style="font-size:20px" class="cag-icon"><svg viewBox="0 0 1024 1024" style="display:inline-block;stroke:currentColor;fill:currentColor;width:20px;height:20px"><path d="M741.282 344.941c16.661 16.662 16.661 43.677 0 60.34l-273.779 273.777c-16.661 16.666-43.678 16.666-60.34 0l-124.444-124.442c-16.663-16.666-16.663-43.678 0-60.343 16.662-16.661 43.677-16.661 60.34 0l94.275 94.276 243.605-243.607c16.666-16.662 43.678-16.662 60.343 0z"></path></svg></span>';

/* Mobile header menu (opens from the hamburger below 768px). Captured from the live DOM on 30 Oct 2026;
   data-nav / data-action hooks added so chrome.js can wire the links. */
export const mobileMenu = () =>
  `<div class="fixed inset-0 z-50 md:hidden" data-component="mobile-menu"><div class="absolute inset-0 right-0 top-0 h-full w-full bg-white"><div class="flex flex-col gap-[24px] px-[20px]"><div class="flex py-[16px] items-center flex-row justify-between"><img alt="CAG Logo" width="111" height="32" src="/images/cag-logo-menu.svg"><img alt="Close menu" width="24" height="24" src="/icons/close-track-app.svg" data-action="close-menu"></div><div class="flex flex-col gap-[24px]"><p class="type-sub-heading-black cursor-pointer ink-black" data-nav="home">Home</p><p class="type-sub-heading-black cursor-pointer ink-black" data-nav="faq">FAQs</p><p class="type-sub-heading-black cursor-pointer ink-black" data-nav="manage-booking">Manage Booking</p><div class="rounded-[60px] flex items-center justify-center border transition-colors duration-200 bg-black border-black cursor-pointer" style="width: 115px; height: 44px; box-shadow: rgba(18, 18, 18, 0.05) 0px 1px 2px 0px;" data-nav="book-now"><p class="type-body-l-bold ink-white">Book Now</p></div></div></div></div></div>`;

/* One row of the footer "Changi Sites" dropdown (below 1024px). Captured from the live DOM on 31 Oct 2026.
   The live row opens its site on click; footer.js adds that. */
export const footerSite = (name) =>
  `<div class="border-b border-[#ABABAB] py-4 text-center" data-i18n-ctx="footer-site"><p class="type-body-l-regular ink-white">${name}</p></div>`;
