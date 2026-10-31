# CSS structure

The site's own stylesheet (`_next/static/chunks/*.css`) is compiled Tailwind and stays byte-identical. The pages used to
carry its utility classes inline (`class="flex flex-col gap-[16px] w-full ..."`, about 5,700 of them) plus 781 inline
`style` attributes plus a `<style>` block copied into every page. That is now split by purpose:

| Where | What goes there |
|---|---|
| `replica/css/base/` | `ink.css` text colours (`ink-black`, `ink-white`, `ink-grey`, `ink-muted`, `ink-light`, `ink-purple`) and `images.css` (`next-img`). Replace the repeated inline `style="color: ...; background: transparent"` |
| `replica/css/components/*.css` | A piece that appears on more than one page. One file per concern: `layout` (stacks, rows, page shell), `header`, `footer`, `buttons`, `forms`, `progress` (step bar), `booking-summary`, `banner`, `accordion` |
| `replica/css/pages/<page>.css` | A piece only that page uses (`landing-hero`, `baggage-stepper`, `contact-form-card` ...). Prefixed with the page name |
| `replica/css/replica.css` | Things the replica adds that the live site does not have (label, feedback tab, checkbox) |
| `replica/css/mui-runtime.css` | MUI / emotion styles captured from the live page, plus the dialog rules that used to be an inline `<style data-emotion>` in every page |

Each page links only the component files it uses, then its own page file (see the `<head>`).

## Naming

- Components: `<area>-<part>`, e.g. `site-header`, `header-nav`, `footer-link`, `footer-column`, `booking-summary-card`.
- Layout primitives: `stack-<gap>` (column) and `row-<gap>[-center]` (row), e.g. `stack-16`, `row-8-center`, `row-between`.
- Page-only: `<page>-<part>`, e.g. `landing-hero`, `trip-card`.
- Variants: a second class on the same element, never a copy of the whole rule.

## How each class is defined

Every class is the exact set of Tailwind rules the live site compiled for that element, copied in the same order and
with the same media queries, `:hover` and `:focus` variants. Nothing was re-typed or re-measured, so the pages look the
same pixel for pixel. The rules sit in `@layer components`, below Tailwind's `utilities` layer, so:

- the utility classes the scripts still add and remove at runtime (`bg-black`, `border-black`, `cursor-not-allowed`,
  `rotate-180`, `bg-gray-100` ...) keep working: the Next button is `btn-pill` plus whichever of those states is active;
- the site's unlayered `cag-*` and MUI rules still win where they did before.

## Where Tailwind utilities remain

Short combinations that are already clear stay as utilities: two classes or fewer, such as `hidden md:block`,
`flex items-center`, `block sm:hidden`, `w-full relative`. They appear on 734 elements (1,170 classes, down from
1,736 elements and 5,694 classes). Converting them would only add names for `display: flex`. Inline `style` is kept
for per-instance sizes (`width: 240px; height: 44px`, progress-bar widths) and values set by script.

## Scripts and class names

The scripts used to find elements with selectors like `.relative.flex.flex-col` or `.border-t`. That coupled behaviour to
styling. Those lookups now use `data-hook` (see [INTEGRATION.md](INTEGRATION.md)), and the footer and FAQ lookups use
the semantic classes (`.faq-item`, `.footer-link`). Restyle freely; the hooks do not change.

## Adding or changing a style

1. Reused on another page, or likely to be: add it to the matching file in `components/`.
2. Only this page: add it to `pages/<page>.css`.
3. Keep the rule inside `@layer components { ... }` and use the same unit scale (px as in the design).
4. A script that needs to find the element gets a `data-hook`, not a class selector.

## How this was checked

Over 100 screenshots (landing, the four booking steps, FAQs, Manage Booking; phone, tablet and desktop widths; with
dropdowns, calendar, dialogs, tooltips, error states, the 中文 switch and the footer accordion open) were taken before
and after the split and compared pixel by pixel: identical (the "Leave this page?" dialog was compared on its own). The footer link clicks (45 URLs per page) produced the same
list before and after.
