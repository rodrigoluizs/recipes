#!/usr/bin/env node
/**
 * Inject the service worker's precache manifest after the build.
 *
 * The SW (`src/pages/sw.js.ts`) ships an empty-array placeholder (see MARKER).
 * This script walks the built `dist/`, lists every page and every same-origin
 * asset each page references (CSS, JS, images, icons), and substitutes that list
 * in. Deriving it from the emitted HTML — rather than guessing URLs at render
 * time — guarantees the precache matches exactly what the browser requests, so
 * an offline page can never load with its hashed CSS/JS bundle missing.
 *
 * BASE mirrors `base` in astro.config.mjs; keep the two in sync.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = '/recipes';
const MARKER = '[/*PRECACHE_MANIFEST*/]';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

/** All files under a directory, recursively. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const urls = new Set();
// Only harvest static assets from href/src (they carry a file extension); page
// links are added separately as slash-terminated routes. This keeps redirecting
// slashless page URLs out of the precache — GitHub Pages 301s `/x` -> `/x/`, and
// a cached redirected response breaks navigations in Safari.
const addAsset = (u) => {
  if (u.startsWith(`${BASE}/`) && /\.[a-zA-Z0-9]+(?:\?|$)/.test(u)) urls.add(u);
};

const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));

for (const file of htmlFiles) {
  // The page's own route as the canonical 200 URL, e.g.
  // dist/en/desserts/x/index.html -> /recipes/en/desserts/x/ (trailing slash).
  const rel = relative(dist, file).split(sep).join('/');
  const route = rel.replace(/index\.html$/, '');
  urls.add(`${BASE}/${route}`.replace(/\/{2,}/g, '/'));

  const html = readFileSync(file, 'utf8');
  // Every href/src asset (stylesheets, scripts, icons, manifest, images).
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) addAsset(m[1]);
  // Responsive image candidates.
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of m[1].split(',')) {
      addAsset(candidate.trim().split(/\s+/)[0]);
    }
  }
}

const manifest = [...urls].sort();

const swPath = join(dist, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
if (!sw.includes(MARKER)) {
  console.error(`✗ precache: marker ${MARKER} not found in dist/sw.js`);
  process.exit(1);
}
writeFileSync(swPath, sw.replace(MARKER, JSON.stringify(manifest)));

console.log(`✓ precache: ${manifest.length} URLs injected into sw.js`);
