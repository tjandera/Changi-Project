# CSS and shared markup

## Where things are

```
booking-baggage/
  index.html        this page's markup only (about 330 lines)
  style.css         styles only this page uses
components/
  header.html       site header, written once
  footer.html       compact + desktop footer, written once
  language-button.html
  shared.css        styles every page uses
  include.js        puts the three .html files into each page
```

Every page folder has the same pair. The landing page is the root `index.html` + `style.css`.

Each page `<head>` links exactly this:

```html
<!-- The live site's compiled CSS + MUI runtime styles: captured, not edited -->
<link rel="stylesheet" href="/_next/static/chunks/0ndgyzgu-3f19.css" />
<link rel="stylesheet" href="/_next/static/chunks/3vw576cu90qfb.css" />
<link rel="stylesheet" href="/replica/css/mui-runtime.css" />
<!-- Shared by every page -->
<link rel="stylesheet" href="/components/shared.css" />
<!-- This page only -->
<link rel="stylesheet" href="/booking-baggage/style.css" />
```

## What goes in which file

| Is it used by... | Put it in |
|---|---|
| one page only | that folder's `style.css`, class prefixed with the page (`baggage-stepper`, `landing-hero`) |
| two or more pages | `components/shared.css`, in the matching section |

`shared.css` has a table of contents at the top. Part A is unlayered: replica features (feedback tab, loading dots),
text colours `ink-*`, the header slot, typography `type-*`, MUI text-field sizing. Part B holds the shared components:
layout, header, footer, buttons, form fields, step progress, booking summary, banner, FAQ accordion, and helpers
(`show-from-md`, `clickable`, `centered-text` ...).

**Every class in a page's HTML is defined in that folder's `style.css` or in `components/shared.css`.** Search either
file for the class name. The only exceptions are MUI's own runtime classes (`MuiInputBase-root`, `css-1x5jdmq` ...,
defined in `replica/css/mui-runtime.css`) and `notranslate`, which only tells Google Translate to skip a node.

Not duplicated on purpose: the footer is styled once in `shared.css`, not copied into seven `style.css` files, so a
footer change is one edit.

## Shared markup (header, footer, 中文 button)

A page marks the spot:

```html
<!-- SITE HEADER · components/header.html (logo, nav, Book Now) -->
<div data-include="header"></div>
```

`components/include.js` (loaded in each `<head>`) fetches `/components/header.html` and swaps the slot for it.
`boot()` waits for that before any page script runs, so the scripts see the same page as if the markup were inline.
While it loads, the header slot keeps the header's height (64px, 68px from 768px) and colour, so the page does not jump.

## Naming

- Shared: `<area>-<part>`, e.g. `site-header`, `header-nav`, `footer-link`, `footer-column`, `booking-summary-card`.
- Layout: `stack-<gap>` (column) and `row-<gap>[-center]` (row), e.g. `stack-16`, `row-8-center`, `row-between`.
- Page only: `<page>-<part>`, e.g. `landing-hero`, `trip-card`, `contact-form-card`.
- Text colour: `ink-black`, `ink-white`, `ink-grey`, `ink-muted`, `ink-light`, `ink-purple`.
- Text style: `type-<size>-<weight>`, matching the Figma text styles: `type-body-l-bold` = "Body L / Bold",
  `type-h6-black` = "H6 / Black". Sizes `h3 h5 h6 body-l body-s small xsmall`; weights `black bold regular italic`.
- Screen size: `show-from-md` (hidden below 768px), `hide-from-md`, `show-below-md`, `show-below-sm` (640px),
  `show-below-lg` / `show-from-lg` (1024px).
- State, set by the scripts: `btn-pill--dark` / `btn-pill--disabled` (Next, Book Now, Make Payment, Retrieve),
  `field-select` / `field-select-disabled` (flight number), `is-flipped` (an arrow while its panel is open).

## How each class is defined

Every class is the exact set of Tailwind rules the live site compiled for that element, in the same order and with the
same media queries, `:hover` and `:focus` variants. Nothing was re-measured, so the pages look the same pixel for pixel.
The rules sit in `@layer components`, below Tailwind's `utilities` layer, so:

- the site's unlayered rules and the MUI runtime styles still win where they did before;
- state classes (`btn-pill--dark`, `btn-pill--disabled`) come after their base class, so they win over it.

The typography classes copy the live site's `cag-typography` + `cag-<size>` + `cag-<weight>` rules, which were
unlayered, so they stay unlayered.

## Where Tailwind utilities remain

None in the pages or `components/*.html`. They remain only in the snippets the scripts build at runtime
(`replica/js/views/templates.js`: dropdown lists, calendar, dialogs, mobile menu), which use the live site's markup as
is. Inline `style` stays only for per-element sizes (`width: 240px; height: 44px`, progress-bar widths) and values the
scripts change.

Removed because no CSS uses them: `transition-transfrom` (a typo on the live site), `scrollbar-hide`,
`cag-form-field-wrapper`, `cag-input-field`, `cag-text-field`, `cag-checkbox`. Renamed site classes:
`partner-item` → `landing-partner`, `marquee` → `landing-marquee`, `field-input` → `text-field`, the next/font body
class → `site-font`.

## Scripts never select by class

Scripts find elements by `data-*` attributes (`data-hook`, `data-action`, `data-field` ..., see
[INTEGRATION.md](INTEGRATION.md)) or by these semantic classes (`.faq-item`, `.footer-link`). Rename or restyle a
utility class freely.

## Adding a style

1. Only this page: add it to the page folder's `style.css`, inside `@layer components { ... }`.
2. Used on a second page: move it to `components/shared.css`, in its section.
3. A script needs the element: give it a `data-hook`, not a class selector.

## How this was checked

Over 100 screenshots (every page; phone, tablet and desktop; dropdowns, calendar, dialogs, tooltips, error states, the
中文 switch, the footer accordion) were taken before and after and compared pixel by pixel: identical. Footer link
clicks open the same 45 URLs per page as before.
