#!/usr/bin/env node
/**
 * Ensure every recipe is available in all supported languages.
 *
 * A "recipe folder" is any directory under `recipes/` that contains at least
 * one `<locale>.md` file. Each such folder must contain a file for every
 * locale, otherwise the build fails. Field/type validation is handled
 * separately by `astro check`.
 *
 * LOCALES mirrors `src/i18n/config.ts`; keep the two in sync when adding a
 * language.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = ['en', 'pt'];

const root = fileURLToPath(new URL('..', import.meta.url));
const recipesDir = join(root, 'recipes');

/** Collect every directory that directly contains a `*.md` file. */
function findRecipeDirs(dir, acc = new Set()) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findRecipeDirs(full, acc);
    } else if (entry.endsWith('.md')) {
      acc.add(dir);
    }
  }
  return acc;
}

const recipeDirs = [...findRecipeDirs(recipesDir)].sort();
const problems = [];

for (const dir of recipeDirs) {
  const files = new Set(readdirSync(dir));
  const missing = LOCALES.filter((l) => !files.has(`${l}.md`));
  if (missing.length > 0) {
    problems.push(
      `  ${relative(root, dir)} — missing: ${missing
        .map((l) => `${l}.md`)
        .join(', ')}`,
    );
  }
}

if (problems.length > 0) {
  console.error(
    `\n✗ i18n validation failed — every recipe must exist in ${LOCALES.join(
      ', ',
    )}:\n${problems.join('\n')}\n`,
  );
  process.exit(1);
}

console.log(
  `✓ i18n: ${recipeDirs.length} recipe(s) present in all locales (${LOCALES.join(
    ', ',
  )}).`,
);
