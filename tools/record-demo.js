/**
 * Records docs/demo.gif, the walkthrough at the top of the README.
 *
 * Needs Playwright with Chromium and ffmpeg (neither is a project dependency):
 *   npm i --no-save playwright && npx playwright install chromium
 *   npm start                      # in another terminal
 *   node tools/record-demo.js      # optional: BASE=http://localhost:8080 node tools/record-demo.js
 *
 * It drives a 1280x800 browser through landing -> luggage -> personal details -> review -> FAQs -> Manage Booking
 * -> 中文, with a drawn cursor and click ripple, saves a PNG per screenshot (crisper than recorded video) and
 * turns them into a 15 fps GIF with ffmpeg.
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const os = require('os');
const { execFileSync } = require('child_process');
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const GIF = path.join(__dirname, '..', 'docs', 'demo.gif');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'oaci-demo-'));
const W = 1280, H = 800;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CURSOR = () => {
  const add = () => {
    if (document.getElementById('__demo-cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo-cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:24px;height:24px;transform-origin:2px 2px;transition:transform .08s';
    c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 2 L3 19 L7.5 14.8 L10.6 21.4 L13.4 20.1 L10.3 13.6 L16.6 13.6 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    let p = [W / 2, H / 2];
    try { p = JSON.parse(sessionStorage.getItem('__demo-cursor') || 'null') || p; } catch {}
    c.style.left = p[0] - 2 + 'px'; c.style.top = p[1] - 2 + 'px';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => {
      c.style.left = e.clientX - 2 + 'px'; c.style.top = e.clientY - 2 + 'px';
      try { sessionStorage.setItem('__demo-cursor', JSON.stringify([e.clientX, e.clientY])); } catch {}
    }, true);
    addEventListener('mousedown', (e) => {
      c.style.transform = 'scale(.85)';
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${e.clientX - 18}px;top:${e.clientY - 18}px;width:36px;height:36px;border-radius:50%;background:rgba(122,53,176,.35);z-index:2147483646;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out;transform:scale(.3)`;
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.4)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 500);
    }, true);
    addEventListener('mouseup', () => (c.style.transform = ''), true);
  };
  if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add);
};
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await ctx.addInitScript(`(${CURSOR.toString().replace(/\bW\b/g, W).replace(/\bH\b/g, H)})()`);
  await ctx.addInitScript(() => { window.open = () => null; });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  const frames = []; let rec = true;
  const loop = (async () => {
    while (rec) {
      const t = Date.now();
      try { const buf = await page.screenshot({ timeout: 1500, caret: 'initial' }); frames.push([t, buf]); }
      catch { await sleep(30); }
    }
  })();
  const at = async (loc, fx = 0.5, fy = 0.5, steps = 22) => {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    const x = b.x + b.width * fx, y = b.y + b.height * fy;
    await page.mouse.move(x, y, { steps });
    await sleep(140);
  };
  const click = async (loc, o = {}) => { await at(loc, o.fx, o.fy, o.steps); await page.mouse.down(); await sleep(70); await page.mouse.up(); await sleep(o.after ?? 450); };
  const type = async (loc, text) => { await click(loc, { after: 150 }); await page.keyboard.type(text, { delay: 65 }); await sleep(250); };
  const smoothScroll = async (y, ms = 900) => { await page.evaluate(([y]) => window.scrollTo({ top: y, behavior: 'smooth' }), [y]); await sleep(ms); };

  // 1. Landing
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.mouse.move(W / 2, H / 2); await sleep(1600);
  const card = page.locator('[data-component="booking-card"]:visible').first();
  await click(card.locator('[data-field="hotel"]'), { after: 700 });
  await click(page.getByText('Marina Bay Sands', { exact: true }).first(), { after: 500 });
  await click(card.locator('[data-field="flightDate"]'), { after: 800 });
  await click(page.locator('.react-calendar__tile:not([disabled])').nth(3), { after: 500 });
  await click(card.locator('[data-field="flight"]'), { after: 800 });
  await click(page.locator('[data-index]').first(), { after: 700 });
  await click(card.locator('[data-action="book-now"]'), { after: 200 });
  // 2. Luggage
  await page.waitForURL('**/booking-baggage/**'); await page.waitForLoadState('networkidle'); await sleep(1400);
  const inc = page.locator('[data-action="increment"]');
  await click(inc.first(), { after: 450 }); await click(inc.first(), { after: 450 }); await click(inc.nth(1), { after: 900 });
  await click(page.locator('[data-action="next"]'), { after: 200 });
  // 3. Personal details
  await page.waitForURL('**/booking-contact/**'); await page.waitForLoadState('networkidle'); await sleep(1300);
  await type(page.locator('[data-field="firstName"]'), 'Alex');
  await type(page.locator('[data-field="lastName"]'), 'Tan');
  await type(page.locator('[data-field="phone"]'), '91234567');
  await type(page.locator('[data-field="email"]'), 'alex.tan@example.com');
  await sleep(500);
  await click(page.locator('[data-action="next"]'), { after: 200 });
  // 4. Review
  await page.waitForURL('**/booking-review/**'); await page.waitForLoadState('networkidle'); await sleep(1500);
  await smoothScroll(300, 1100);
  await click(page.locator('[data-field="terms"]'), { after: 600 });
  await click(page.locator('[data-action="make-payment"]'), { after: 2200 });
  await click(page.locator('[data-dialog="primary"]'), { after: 700 });
  // 5. FAQs
  await smoothScroll(0, 700);
  await click(page.locator('header [data-nav="faq"]:visible').first(), { after: 200 });
  await page.waitForURL('**/faq/**'); await page.waitForLoadState('networkidle'); await sleep(1200);
  await click(page.locator('[role=tab]').nth(1), { after: 700 });
  await click(page.locator('[data-list="faq-items"] > div').first().locator('div').first(), { after: 1600 });
  // 6. Manage Booking
  await click(page.locator('header [data-nav="manage-booking"]:visible').first(), { after: 200 });
  await page.waitForURL('**/manage-booking-pin/**'); await page.waitForLoadState('networkidle'); await sleep(1200);
  await type(page.locator('[data-field="bookingCode"]'), 'ABC123');
  await click(page.locator('[data-field="pin"]').first(), { after: 100 });
  await page.keyboard.type('482915', { delay: 90 }); await sleep(800);
  // 7. 中文 switch
  await click(page.locator('[data-action="toggle-language"]').first(), { after: 1800 });
  await click(page.locator('[data-action="toggle-language"]').first(), { after: 1200 });
  rec = false; await loop;
  await browser.close();
  const t0 = frames[0][0];
  const list = [];
  frames.forEach(([t, buf], i) => {
    const f = path.join(OUT, `f${String(i).padStart(5, '0')}.png`); fs.writeFileSync(f, buf);
    const next = i + 1 < frames.length ? frames[i + 1][0] : t + 100;
    list.push(`file '${f}'\nduration ${((next - t) / 1000).toFixed(3)}`);
  });
  list.push(`file '${path.join(OUT, `f${String(frames.length - 1).padStart(5, '0')}.png`)}'`);
  fs.writeFileSync(path.join(OUT, 'frames.txt'), list.join('\n') + '\n');
  console.log('frames', frames.length, 'seconds', ((frames.at(-1)[0] - t0) / 1000).toFixed(1));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'frames.txt'),
    '-vf', 'fps=15,scale=1280:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    '-loop', '0', GIF], { stdio: 'inherit' });
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('wrote', GIF, (fs.statSync(GIF).size / 1e6).toFixed(1), 'MB');
})();
