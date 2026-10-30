#!/usr/bin/env python3
"""
Rebuilds the static HTML skeletons in this repo from the saved pages.

Provenance
----------
SAVED  = the "Save Page As" captures in "Changi Case-Study.zip" (Landing, Step 1, 2, 4).
LIVE   = markup captured from the live DOM on 30 Oct 2026 for screens the zip did not
         contain (Step 3 form, Manage Booking, FAQ, dialogs, dropdowns). See docs/PROVENANCE.md.

What this script does to the original markup
--------------------------------------------
1. Keeps the original <header>, <main> and <footer> markup and Tailwind classes as-is.
2. Removes every <script>, the Next.js/Turbopack bundles, Adobe Launch, Qualtrics,
   Google Translate, Grammarly and other runtime/third-party nodes.
3. Rewrites "./<page>_files/x.svg" asset paths back to the site's original paths (/icons, /images, /follow-us).
4. Rewrites absolute links to offairportcheckin.changiairport.com into local routes.
5. Replaces the captured personal data with empty, data-bound placeholders.
6. Adds data-* hooks (data-bind, data-field, data-action, data-nav, data-tooltip, data-template)
   that /replica/js uses to fill content from /data/*.json. These hooks are the integration points.

Usage:  python3 tools/build_pages.py "<path to unzipped Changi Case-Study>" "<path to live captures>"
"""
import os, re, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED = sys.argv[1]
LIVE = sys.argv[2]

PAGES = {
    "landing": "Landing Page/Off Airport Check-In.html",
    "step1": "Booking-Review-Details-Changed/Off Airport Booking-Details-Changed.html",
    "step2": "Booking Baggage/Off Airport booking baggage.html",
    "step4": "Booking Review/Off Airport booking-review.html",
}

SOCIAL = {"facebook.svg", "instagram.svg", "linkedin.svg", "telegram.svg", "tiktok.svg",
          "x.svg", "youtube.svg", "follow-1.svg", "follow-2.svg"}


def canonical(name):
    if name in SOCIAL:
        return "/follow-us/" + name
    if name == "cag-logo.svg" or name.endswith(".png"):
        return "/images/" + name
    return "/icons/" + name


def read(p):
    return open(p, encoding="utf-8").read()


def sub_exact(html, old, new, count=1, label=""):
    n = html.count(old)
    if n != count:
        raise SystemExit(f"[{label}] expected {count} match(es), found {n}: {old[:120]!r}")
    return html.replace(old, new)


def strip_runtime(html):
    html = re.sub(r"<script\b.*?</script>", "", html, flags=re.S)
    html = re.sub(r"<iframe\b.*?</iframe>", "", html, flags=re.S)
    html = re.sub(r"<noscript\b.*?</noscript>", "", html, flags=re.S)
    return html


def fix_assets(html):
    html = re.sub(r'src="\./[^"]*?_files/([^"/]+)"', lambda m: f'src="{canonical(m.group(1))}"', html)
    html = re.sub(r'href="\./[^"]*?_files/([^"/]+)"', lambda m: f'href="{canonical(m.group(1))}"', html)
    html = html.replace('href="https://offairportcheckin.changiairport.com/booking-details"', 'href="/booking-details/"')
    html = html.replace('href="https://offairportcheckin.changiairport.com/"', 'href="/"')
    html = re.sub(r'href="https://offairportcheckin\.changiairport\.com/([a-z][a-z0-9-]*)"', r'href="/\1/"', html)
    html = html.replace('src="https://offairportcheckin.changiairport.com/images/', 'src="/images/')
    return html


def shell(page_key):
    """Return the <div class="min-h-screen flex flex-col"> app shell of a saved page."""
    s = read(os.path.join(SAVED, PAGES[page_key]))
    b = s[s.find("<body"):]
    start = b.find('<div class="min-h-screen flex flex-col">')
    end = b.find('<div id="google_translate_element"')
    assert start > 0 and end > start, page_key
    inner = b[start:end] + "</div>"
    return fix_assets(strip_runtime(inner))


def split_main(app):
    i, j = app.find("<main"), app.find("</main>") + len("</main>")
    return app[:i], app[i:j], app[j:]


# ---------------------------------------------------------------- shared chrome
def chrome(app):
    lab = "header"
    app = sub_exact(app, '<a href="/"><div class="flex flex-row items-center gap-[24px]">',
                    '<a href="/" data-nav="home"><div class="flex flex-row items-center gap-[24px]">', label=lab)
    app = sub_exact(app, 'style="color:#ffffff;background:transparent">FAQs</p>',
                    'style="color:#ffffff;background:transparent" data-nav="faq">FAQs</p>', label=lab)
    app = sub_exact(app, 'style="color:#ffffff;background:transparent">Manage Booking</p>',
                    'style="color:#ffffff;background:transparent" data-nav="manage-booking">Manage Booking</p>', label=lab)
    app = sub_exact(app, '<div class="flex items-center justify-center cursor-pointer w-[150px] h-[36px] rounded-[60px] bg-[#EFEBE7] border border-[#EFEBE7]"',
                    '<div data-nav="book-now" class="flex items-center justify-center cursor-pointer w-[150px] h-[36px] rounded-[60px] bg-[#EFEBE7] border border-[#EFEBE7]"', label=lab)
    app = sub_exact(app, 'aria-label="Toggle Language">', 'aria-label="Toggle Language" data-action="toggle-language">', label="lang")
    return app


NEXT_DISABLED = ('<div class="rounded-[60px] flex items-center justify-center border transition-colors duration-200 '
                 'bg-[#E5E5E5] border-[#CCCCCC] cursor-not-allowed"')


def next_button(html, action="next", label=""):
    return sub_exact(html, NEXT_DISABLED, NEXT_DISABLED.replace('<div class=', f'<div data-action="{action}" class=', 1), label=label)


def bind_pair(html, text, key, count=2, label=""):
    """The site renders most values twice (mobile <p class="md:hidden"> + desktop <p class="hidden md:block">)."""
    pat = re.compile(r'(<p class="cag-typography [^"]*"[^>]*?)>' + re.escape(text) + r"</p>")
    found = pat.findall(html)
    if len(found) != count:
        raise SystemExit(f"[{label}] bind {key}: expected {count}, found {len(found)}")
    return pat.sub(lambda m: f'{m.group(1)} data-bind="{key}"></p>', html)


def summary_trip(html, label):
    html = bind_pair(html, "Marina Bay Sands", "trip.hotel", label=label)
    html = bind_pair(html, "SQ836 · 31 Oct 2026 · 17:00 SGT", "trip.flightSummary", label=label)
    return html


def edit_pencils(html, actions, label):
    pencil = '<img alt="edit-summary" loading="lazy" width="24" height="24"'
    assert html.count(pencil) == len(actions), (label, html.count(pencil))
    for a in actions:
        html = html.replace(pencil, f'<img data-action="{a}" alt="edit-summary" loading="lazy" width="24" height="24"', 1)
    return html


def luggage_block(html, label, totals_count=1):
    """Turn the single 'Standard Luggage · 1 item(s)' line into a template and bind the totals."""
    line_start = '<div class="flex flex-col gap-[2px] w-full">'
    assert html.count(line_start) == 1, label
    html = html.replace('<div class="flex flex-col gap-[16px]">' + line_start,
                        '<div class="flex flex-col gap-[16px]" data-list="luggage-lines">' + line_start.replace('<div ', '<div data-template="luggage-line" ', 1))
    html = bind_pair(html, "Standard Luggage", "line.label", label=label)
    html = re.sub(r'(<p class="cag-typography cag-(?:s|l)-body cag-bold (?:md:hidden|hidden md:block)" style="[^"]*")>29\.00</p>(</div></div><p class="cag-typography cag-small-text)',
                  r'\1 data-bind="line.subtotal"></p>\2', html)
    html = re.sub(r'(<p class="cag-typography cag-(?:s|l)-body cag-bold (?:md:hidden|hidden md:block)" style="[^"]*")>29\.00</p>',
                  r'\1 data-bind-pending="x">29.00</p>', html)
    # small "1 item(s)" under the line
    html = re.sub(r'(<p class="cag-typography cag-small-text cag-bold (?:md:hidden|hidden md:block)" style="[^"]*")>1 item\(s\)</p>',
                  r'\1 data-bind="line.itemsLabel"></p>', html)
    return html


def totals(html, label, items_text, cost_text):
    html = re.sub(r'(<p class="cag-typography cag-(?:s|l)-body cag-bold (?:md:hidden|hidden md:block) " style="[^"]*")>' + re.escape(items_text) + r"</p>",
                  r'\1 data-bind="luggage.totalItemsLabel"></p>', html)
    html = re.sub(r'(<p class="cag-typography cag-(?:s|l)-body cag-bold (?:md:hidden|hidden md:block) " style="[^"]*")>S\$</p>',
                  r'\1 data-bind="currency">S$</p>', html)
    html = re.sub(r'(<p class="cag-typography cag-(?:s|l)-body cag-bold (?:md:hidden|hidden md:block) " style="[^"]*")>' + re.escape(cost_text) + r"</p>",
                  r'\1 data-bind="luggage.totalCost"></p>', html)
    return html


def finalize_line_subtotals(html):
    # any remaining 29.00 values inside a luggage-line template are the line subtotal
    html = html.replace(' data-bind-pending="x">29.00</p>', ' data-bind="line.subtotal"></p>')
    return html


# ---------------------------------------------------------------- page builders
def build_landing():
    app = chrome(shell("landing"))
    lab = "landing"
    # the saved page caught the Location dropdown open; the list is rendered by JS on click
    app = re.sub(r'<div class="absolute z-50 mt-2 bg-white shadow-lg rounded-lg max-h-\[218px\] overflow-y-auto" style="width: 293px;">.*?The Fullerton Hotel</p></div></div>',
                 "", app, count=1, flags=re.S)
    card = '<div class="w-full md:w-[343px] rounded-[24px] border border-[#EFEBE7] bg-[#F6F3F2] p-[24px]">'
    app = sub_exact(app, card, card.replace("<div ", '<div data-component="booking-card" ', 1), count=2, label=lab)
    loc = ('<input type="text" class="w-full h-[36px] rounded-[8px] border pl-3 pr-10 focus:border-[#7a35b0] focus:ring-4 '
           'focus:ring-[#ece0f5] focus:outline-none focus:border-2 bg-white border-[#CCCCCC] cursor-pointer" value="">')
    app = sub_exact(app, loc, loc.replace("<input ", '<input data-field="hotel" readonly="" ', 1), count=2, label=lab)
    app = re.sub(r'<input type="text" data-testid="date-input" readonly="" class="', '<input data-field="flightDate" type="text" data-testid="date-input" readonly="" class="', app)
    app = app.replace('" value="31 Oct 2026">', '" value="">')
    app = sub_exact(app, '<input type="text" placeholder="Select hotel and flight date first" disabled=""',
                    '<input data-field="flight" readonly="" type="text" placeholder="Select hotel and flight date first" disabled=""', count=2, label=lab)
    app = app.replace('<img alt="booking-reference-info" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer" style="color:transparent" src="/icons/booking-reference-info.svg">',
                      '<img data-tooltip="departureDate" alt="booking-reference-info" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer" style="color:transparent" src="/icons/booking-reference-info.svg">')
    book = ('<div class="rounded-[60px] flex items-center justify-center border transition-colors duration-200 bg-[#E5E5E5] '
            'border-[#CCCCCC] cursor-not-allowed" style="width:100%;height:40px;')
    app = sub_exact(app, book, book.replace("<div ", '<div data-action="book-now" ', 1), count=2, label=lab)
    return app


def build_step1():
    app = chrome(shell("step1"))
    lab = "step1"
    app = sub_exact(app, 'focus:border-2 bg-white border-[#CCCCCC] cursor-pointer" type="text" value="Marina Bay Sands">',
                    'focus:border-2 bg-white border-[#CCCCCC] cursor-pointer" type="text" value="" data-field="hotel" readonly="">', label=lab)
    app = sub_exact(app, '<input data-testid="date-input" readonly=""', '<input data-field="flightDate" data-testid="date-input" readonly=""', label=lab)
    app = sub_exact(app, '" type="text" value="31 Oct 2026">', '" type="text" value="">', label=lab)
    app = sub_exact(app, '<input placeholder="" class="w-full h-[36px]', '<input data-field="flight" readonly="" placeholder="" class="w-full h-[36px]', label=lab)
    app, n = re.subn(r'(<p class="cag-typography cag-s-body cag-bold" style="[^"]*")>-</p>', r'\1 data-bind="trip.flightTime">-</p>', app)
    assert n == 1, ("flight time", n)
    app = sub_exact(app, '<img alt="arrow-up-black" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer transition-transform duration-300 "',
                    '<img data-action="toggle-notes" alt="arrow-up-black" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer transition-transform duration-300 "', label=lab)
    app = sub_exact(app, '<span class="cursor-pointer font-bold text-[#7a35b0]">Learn more</span>',
                    '<span data-nav="faq" class="cursor-pointer font-bold text-[#7a35b0]">Learn more</span>', label=lab)
    app = sub_exact(app, '<div class="cursor-pointer"><p class="cag-typography cag-s-body cag-bold text-right"',
                    '<div class="cursor-pointer" data-nav="faq"><p class="cag-typography cag-s-body cag-bold text-right"', label=lab)
    app = sub_exact(app, '<div class="w-full flex flex-col gap-[12px] rounded-[8px] py-[12px] px-[16px] bg-[#F6F3F2]">',
                    '<div data-component="notes" class="w-full flex flex-col gap-[12px] rounded-[8px] py-[12px] px-[16px] bg-[#F6F3F2]">', label=lab)
    return next_button(app, label=lab)


def summary_shell_binds(app, lab):
    app = sub_exact(app, '<div class="cursor-pointer flex flex-row items-center justify-between" style="padding-bottom: 0px;">',
                    '<div data-action="toggle-summary" class="cursor-pointer flex flex-row items-center justify-between" style="padding-bottom: 0px;">', label=lab)
    app = sub_exact(app, '<div class="flex flex-col gap-[24px] pt-[24px]">', '<div data-component="summary-body" class="flex flex-col gap-[24px] pt-[24px]">', label=lab)
    return summary_trip(app, lab)


def build_step2():
    app = chrome(shell("step2"))
    lab = "step2"
    app = summary_shell_binds(app, lab)
    app = edit_pencils(app, ["edit-trip"], lab)
    stepper = '<div class="border border-[#CCCCCC] rounded-[8px] flex flex-row w-[124px] h-[36px] px-[12px] py-[8px] items-center justify-between">'
    app = sub_exact(app, stepper, stepper.replace("<div ", '<div data-stepper="standard" ', 1).replace("STEP", ""), count=2, label=lab)
    # second stepper becomes odd-sized
    i = app.rfind('data-stepper="standard"')
    app = app[:i] + 'data-stepper="oddSized"' + app[i + len('data-stepper="standard"'):]
    app = app.replace('<img alt="remove-item"', '<img data-action="decrement" alt="remove-item"')
    app = app.replace('<img alt="add-item"', '<img data-action="increment" alt="add-item"')
    app = sub_exact(app, 'style="color: rgb(171, 171, 171); background: transparent;">0</p>',
                    'style="color: rgb(171, 171, 171); background: transparent;" data-bind="count">0</p>', count=2, label=lab)
    # per-row price (S$ + 0.00 in grey)
    app = sub_exact(app, '<div class="flex flex-row gap-[8px]"><p class="cag-typography cag-l-body cag-bold" style="color: rgb(153, 153, 153); background: transparent;">S$</p><p class="cag-typography cag-l-body cag-bold" style="color: rgb(153, 153, 153); background: transparent;">0.00</p></div>',
                    '<div class="flex flex-row gap-[8px]" data-component="row-price"><p class="cag-typography cag-l-body cag-bold" style="color: rgb(153, 153, 153); background: transparent;" data-bind="currency">S$</p><p class="cag-typography cag-l-body cag-bold" style="color: rgb(153, 153, 153); background: transparent;" data-bind="subtotal">0.00</p></div>',
                    count=2, label=lab)
    app = sub_exact(app, 'Standard Luggage</p><img alt="info"', 'Standard Luggage</p><img data-tooltip="standardLuggage" alt="info"', label=lab)
    app = sub_exact(app, 'Odd-sized Items</p><img alt="info"', 'Odd-sized Items</p><img data-action="open-odd-sized" alt="info"', label=lab)
    app = totals(app, lab, "0 item(s)", "0.00")
    return next_button(app, label=lab)


def build_step3():
    """Shell from the saved Step 2 page; main content captured from the live /booking-contact DOM."""
    app = chrome(shell("step2"))
    head, main, tail = split_main(app)
    content = read(os.path.join(LIVE, "step3-content.html")).strip()
    content = re.sub(r"<!-- TOOLTIP.*?-->", "", content, flags=re.S)
    i = main.find('<div class="bg-[#FCFCFC] py-[24px] px-[16px]')
    main = main[:i] + content + "</div></main>"
    app = head + main + tail
    lab = "step3"
    app = summary_shell_binds(app, lab)
    app = edit_pencils(app, ["edit-trip", "edit-luggage"], lab)
    app = luggage_block(app, lab)
    app = totals(app, lab, "1 item(s)", "29.00")
    app = finalize_line_subtotals(app)
    inputs = '<input aria-invalid="false" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" type="text" value="">'
    for f in ["firstName", "lastName", "email"]:
        app = app.replace(inputs, inputs.replace("<input ", f'<input data-field="{f}" ', 1), 1)
    app = sub_exact(app, 'type="text" value="" name="contactNumber">', 'type="text" value="" name="contactNumber" data-field="phone" inputmode="tel">', label=lab)
    app = sub_exact(app, '<div class="flex flex-row items-center cursor-pointer bg-white px-3 py-[8px] lg:py-[11px] border-r border-[#CCCCCC]">',
                    '<div data-action="toggle-country" class="flex flex-row items-center cursor-pointer bg-white px-3 py-[8px] lg:py-[11px] border-r border-[#CCCCCC]">', label=lab)
    app = sub_exact(app, '<div class="w-[28px] h-[20px] flex-shrink-0">', '<div data-bind-html="contact.flagSvg" class="w-[28px] h-[20px] flex-shrink-0">', label=lab)
    app = sub_exact(app, 'background: transparent;">+65</p>', 'background: transparent;" data-bind="contact.dialCode">+65</p>', label=lab)
    app = sub_exact(app, '<img alt="booking-reference-info" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer" src="/icons/booking-reference-info.svg"',
                    '<img data-tooltip="contactNumber" alt="booking-reference-info" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="cursor-pointer" src="/icons/booking-reference-info.svg"', label=lab)
    return next_button(app, label=lab)


def build_step4():
    app = chrome(shell("step4"))
    lab = "step4"
    app = edit_pencils(app, ["edit-trip", "edit-luggage", "edit-contact"], lab)
    app = summary_trip(app, lab)
    app = luggage_block(app, lab)
    app = totals(app, lab, "1 item(s)", "29.00")
    app = finalize_line_subtotals(app)
    # captured personal data -> bound placeholders (no real data in the repo)
    captured = []
    for label, key in [("First/Last Name (as per passport)", "contact.fullName"),
                       ("Contact Number", "contact.phoneDisplay"),
                       ("Email Address", "contact.email")]:
        pat = re.compile(r'(' + re.escape(label) + r'</p>)'
                         r'(<p class="cag-typography [^"]*" style="[^"]*")>([^<]*)</p>'
                         r'(<p class="cag-typography [^"]*" style="[^"]*")>([^<]*)</p>')
        m = pat.search(app)
        assert m, (lab, label)
        captured += [m.group(3), m.group(5)]
        app = pat.sub(lambda m: f'{m.group(1)}{m.group(2)} data-bind="{key}"></p>{m.group(4)} data-bind="{key}"></p>', app, count=1)
    assert not any(v and v in app for v in captured), "personal data left in step 4"
    app = sub_exact(app, '<input class="PrivateSwitchBase-input css-1m9pwf3"', '<input data-field="terms" class="PrivateSwitchBase-input css-1m9pwf3"', label=lab)
    app = sub_exact(app, '<span class="cursor-pointer font-bold text-[#7A35B0]">Terms and Conditions</span>',
                    '<span data-action="open-terms" class="cursor-pointer font-bold text-[#7A35B0]">Terms and Conditions</span>', label=lab)
    app = sub_exact(app, "<span class=\"cursor-pointer font-bold text-[#7A35B0]\">CAG's Privacy Policy.</span>",
                    "<span data-action=\"open-privacy\" class=\"cursor-pointer font-bold text-[#7A35B0]\">CAG's Privacy Policy.</span>", label=lab)
    return next_button(app, action="make-payment", label=lab)


def with_live_main(live_file):
    app = chrome(shell("step2"))
    head, _main, tail = split_main(app)
    main = read(os.path.join(LIVE, live_file)).strip()
    main = main.replace('aria-label="Toggle Language">', 'aria-label="Toggle Language" data-action="toggle-language">')
    return head + main + tail


def build_manage():
    app = with_live_main("manage-booking-pin-main.html")
    lab = "manage"
    app = app.replace('src="/images/skyline-illustration-desktop.png"', 'src="/images/skyline-illustration-desktop.webp"')
    app = app.replace('src="/images/skyline-illustration.png"', 'src="/images/skyline-illustration-desktop.webp"')
    app = re.sub(r'data-tooltip="Refer to your confirmation email for your booking confirmation code"', 'data-tooltip="bookingCode"', app)
    app = re.sub(r'data-tooltip="Refer to your confirmation email for your booking PIN"', 'data-tooltip="bookingPin"', app)
    app = sub_exact(app, '<input aria-invalid="false" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value="">',
                    '<input data-field="bookingCode" aria-invalid="false" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value="">', label=lab)
    app = app.replace('<input type="text" maxlength="1" inputmode="text" pattern="[0-9]*"', '<input data-field="pin" type="text" maxlength="1" inputmode="text" pattern="[0-9]*"')
    nb = '<div class="rounded-[60px] flex items-center justify-center border transition-colors duration-200 bg-[#E5E5E5] border-[#CCCCCC] cursor-not-allowed" style="width:240px;'
    app = sub_exact(app, nb, nb.replace("<div ", '<div data-action="retrieve-booking" ', 1), label=lab)
    return app


def build_faq():
    app = with_live_main("faq-main.html")
    app = app.replace('src="/images/skyline-illustration-desktop.png"', 'src="/images/skyline-illustration-desktop.webp"')
    app = app.replace('src="/images/skyline-illustration.png"', 'src="/images/skyline-illustration-desktop.webp"')
    return app


# ---------------------------------------------------------------- document
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Off Airport Check-In · Replica</title>
<meta name="description" content="Case-study replica of the Changi Off-Airport Check-In booking flow. Not affiliated with Changi Airport Group. No data is sent anywhere.">
<link rel="icon" href="/images/cag-logo.svg">
<link rel="preload" href="/_next/static/media/83afe278b6a6bb3c-s.p.2bn3s6zvc0dyp.woff2" as="font" crossorigin="" type="font/woff2">
<!-- Original compiled Tailwind + global CSS, byte-identical to the saved site -->
<link rel="stylesheet" href="/_next/static/chunks/0ndgyzgu-3f19.css" data-precedence="next">
<link rel="stylesheet" href="/_next/static/chunks/3vw576cu90qfb.css" data-precedence="next">
<style data-emotion="css 7ewhav" data-s="">@media print{.css-7ewhav{position:absolute!important;}}.css-7ewhav .MuiPaper-root{border-radius:16px;}</style>
<!-- MUI runtime styles captured from the live page (emotion injects them at runtime) -->
<link rel="stylesheet" href="/replica/css/mui-runtime.css">
<!-- Replica-only additions: replica label, feedback tab, checkbox -->
<link rel="stylesheet" href="/replica/css/replica.css">
</head>
"""

BODY_OPEN = '<body class="inter_5972bc34-module__OU16Qa__className" data-page="{page}"><div hidden=""></div>'


def document(page, app, scripts):
    tags = "".join(scripts)
    return HEAD + BODY_OPEN.format(page=page) + app + tags + "\n</body>\n</html>\n"


def module(name):
    return f'\n<script type="module" src="/replica/js/pages/{name}.js"></script>'


def write(rel, html):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(html)
    print(f"wrote {rel} ({len(html):,} bytes)")


if __name__ == "__main__":
    write("index.html", document("landing", build_landing(), [module("landing")]))
    write("booking-details/index.html", document("trip-details", build_step1(), [module("trip-details")]))
    write("booking-baggage/index.html", document("luggage", build_step2(), [module("luggage")]))
    write("booking-contact/index.html", document("personal-details", build_step3(),
          ['\n<script src="/replica/vendor/libphonenumber-min.js"></script>', module("personal-details")]))
    write("booking-review/index.html", document("review", build_step4(),
          ['\n<script src="/replica/vendor/libphonenumber-min.js"></script>', module("review")]))
    write("manage-booking-pin/index.html", document("manage-booking", build_manage(), [module("manage-booking")]))
    write("faq/index.html", document("faq", build_faq(), [module("faq")]))
