# CSS and shared markup

## Where things are

```
booking-baggage/
  index.html        this page's markup only (about 340 lines)
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

`shared.css` has a table of contents at the top. Part A is unlayered (replica features such as the feedback tab and
loading dots, the text colours `ink-*`, the header slot). Part B holds the shared components: layout, header, footer,
buttons, form fields, step progress, booking summary, banner, FAQ accordion.

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

## How each class is defined

Every class is the exact set of Tailwind rules the live site compiled for that element, in the same order and with the
same media queries, `:hover` and `:focus` variants. Nothing was re-measured, so the pages look the same pixel for pixel.
The rules sit in `@layer components`, below Tailwind's `utilities` layer, so:

- the utility classes the scripts add and remove at runtime (`bg-black`, `border-black`, `cursor-not-allowed`,
  `rotate-180`, `bg-gray-100` ...) still win: the Next button is `btn-pill` plus whichever state is active;
- the site's own `cag-*` and MUI rules still win where they did before.

## Where Tailwind utilities remain

Pairs that already read clearly stay as utilities: `hidden md:block`, `flex items-center`, `block sm:hidden`,
`w-full relative`. A name for `display: flex` would not help anyone. Inline `style` stays only for per-element sizes
(`width: 240px; height: 44px`, progress-bar widths) and values the scripts change.

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
