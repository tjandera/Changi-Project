#!/usr/bin/env node
/**
 * Keeps the shared HTML pieces in sync across the pages. No dependencies.
 *
 *   components/header.html           site header (logo, nav, Book Now)
 *   components/footer.html           compact footer + desktop footer
 *   components/language-button.html  floating 中文 / EN button
 *
 * A page marks where a piece goes:
 *
 *   <!-- @component header -->
 *   ...copied from components/header.html, do not edit here...
 *   <!-- @end header -->
 *
 * Edit the file in components/, then run `npm run components` (`npm start` does it for you). The pages stay plain
 * static HTML, so hosting needs no build step: commit the synced pages.
 *
 *   node scripts/build-components.js           rewrite the pages
 *   node scripts/build-components.js --check   exit 1 if any page is out of sync (for CI / before committing)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', 'components', 'docs', 'tools', 'scripts', '_next', 'data', 'icons', 'images', 'flags', 'follow-us', 'files', 'replica', '.git']);
const check = process.argv.includes('--check');

/** index.html and every <folder>/index.html that is a site page. */
function pages() {
  const out = [];
  if (fs.existsSync(path.join(ROOT, 'index.html'))) out.push('index.html');
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || SKIP.has(d.name) || d.name.startsWith('.')) continue;
    const f = path.join(d.name, 'index.html');
    if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  }
  return out;
}

const MARK = /^([ \t]*)<!-- @component ([\w-]+) -->\n[\s\S]*?^\1<!-- @end \2 -->/gm;
const cache = {};
function component(name) {
  if (!cache[name]) {
    const file = path.join(ROOT, 'components', `${name}.html`);
    if (!fs.existsSync(file)) throw new Error(`components/${name}.html does not exist`);
    cache[name] = fs.readFileSync(file, 'utf8').replace(/\s+$/, '').split('\n');
  }
  return cache[name];
}

let stale = 0;
for (const page of pages()) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(MARK, (_, indent, name) => {
    const body = component(name).map((l) => (l ? indent + l : l)).join('\n');
    return `${indent}<!-- @component ${name} -->\n${body}\n${indent}<!-- @end ${name} -->`;
  });
  if (after === before) continue;
  stale += 1;
  if (check) console.log(`out of sync: ${page}`);
  else {
    fs.writeFileSync(file, after);
    console.log(`updated: ${page}`);
  }
}
if (check && stale) {
  console.log('Run `npm run components` and commit the result.');
  process.exit(1);
}
if (!stale) console.log('components: all pages in sync');
