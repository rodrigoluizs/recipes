# Recipes

A personal recipe collection stored as Markdown, with an Astro website that
auto-deploys to GitHub Pages.

## Internationalization

The site ships in **English and Portuguese**. Each recipe folder holds one
Markdown file per language — `en.md` and `pt.md` — with images shared alongside:
`recipes/<category>/<slug>/{en,pt}.md`. The folder path
(`<category>/<slug>`) is the language-neutral key and URL slug; the language is
the filename.

- **Both languages are required.** `npm run validate` fails if any recipe is
  missing `en.md` or `pt.md` (checked by `scripts/validate-i18n.mjs`).
- The site auto-detects the visitor's language client-side (saved preference →
  browser language → English) at `/recipes/`, which redirects to
  `/recipes/<locale>/...`. A compact EN/PT toggle lets the visitor switch
  manually; the choice is remembered.
- Site UI strings live in `src/i18n/ui.ts` (keyed per locale, English is the
  fallback); locales are declared in `src/i18n/config.ts`.

## Recipe structure

Recipes live at `recipes/<category>/<slug>/<locale>.md` (one folder per recipe,
images shared across languages). Content is written in the file's language
(English in `en.md`, Portuguese in `pt.md`); amounts and units stay identical.

Every recipe file MUST contain:

- **Servings** — `servings` (integer)
- **Prep Time** — `prepTime` (free text, e.g. `20 min`)
- **Cook Time** — `cookTime` (free text, e.g. `1 hr 10 min`)
- **Ingredients** — `ingredients` (list, >= 1); each needs a canonical `id`
  (see Ingredient shape below)
- **Method** — `method` (list of steps, >= 1)

Optional:

- **Photos** — `image` (relative path, e.g. `./brownie.jpg`)
- **Website** — `sourceUrl` (URL of the original recipe)
- **Nutrition** — `nutrition` (free-form key/value)
- `tags` (list) and free-text notes in the Markdown body

### Ingredient shape

Each ingredient is structured so quantities can be scaled and referenced:

```yaml
- id: semi-cured-cheese  # required; canonical id from src/data/ingredients.ts
  amount: 250            # number; omit for non-scalable items ("to taste")
  unit: g                # optional; omit for countable items (eggs)
  name: cheese           # required; referenced from steps via [[cheese]]
  note: grated           # optional muted clarifier shown after the name
```

The `id` is a **locale-neutral canonical ingredient id** (identical in `en.md`
and `pt.md`) defined in `src/data/ingredients.ts`, which maps each id to its
display name per locale. It is the shared identity the shopping list uses to
sum quantities across recipes and languages, so `cebola` (pt) and `onion` (en)
both carry `id: onion` and merge. Reuse an existing id when it is truly the same
product; otherwise add a new DB entry (both locales). **Never conflate
near-duplicates** — things bought separately get separate ids (`milk` vs
`whole-milk`, `baking-powder` vs `dry-yeast`, `salt` vs `coarse-salt`). The
`new-recipe` skill enforces this; `npm run validate` fails on an unknown id.

### Method references

In a `method` step, wrap an ingredient in `[[name]]` to highlight it and make it
tappable (shows the ingredient's quantity, respecting the current scale). The
name must match an ingredient `name` (case-insensitive) **within the same
file** — so `pt.md` references the Portuguese names and `en.md` the English
ones. Steps containing `: ` must be quoted in YAML.

### Example

```markdown
---
title: Chocolate Brownie
servings: 12
prepTime: 20 min
cookTime: 30 min
ingredients:
  - id: dark-chocolate
    amount: 200
    unit: g
    name: dark chocolate
  - id: egg
    amount: 3
    name: eggs
method:
  - Melt the [[dark chocolate]].
  - "Whisk the [[eggs]]: fold into the chocolate."
tags: [chocolate, baking]
---

Optional notes.
```

## Adding a recipe

Use the `new-recipe` skill — it interviews for the fields, writes **both**
`en.md` and `pt.md` with the correct structure, and opens a local preview
(both languages) in the browser before any PR.

## Shopping list

Visitors can add a recipe's ingredients to a shopping list (cart icon in the
home header and the recipe hero → `/<locale>/shopping-list`).

- **Client-side only.** State lives in `localStorage` (`recipes:shopping-list`,
  versioned `{ v: 1, items }`) — no backend — and works offline in the PWA
  (the page is auto-precached by `scripts/precache-manifest.mjs`).
- **Merging by canonical id.** Adding uses the recipe's current scale as a
  snapshot; lines with the same ingredient `id` **and** `unit` sum their
  amounts, so the same ingredient across recipes/languages collapses to one
  line. Different units of one id stay as separate lines. Names shown come from
  `src/data/ingredients.ts` in the viewer's locale.
- **Free-text items.** Users can add manual items (not from any recipe); these
  never merge with recipe lines.
- **Interaction.** Tap to mark "already have" (strike, reversible), the `✕` to
  remove a line, plus *Clear checked* and *Empty list*.
- Pure logic in `src/lib/shopping-list.ts` (unit-tested); storage/DOM glue in
  `src/scripts/shopping-store.ts` and `src/scripts/shopping-list-page.ts`.

## Structured data (SEO)

Every recipe page automatically emits
[schema.org/Recipe](https://schema.org/Recipe) JSON-LD (the structured data
Google reads for Recipe rich results). It is **derived from the frontmatter at
build time** — there is nothing to author per recipe, and no field to fill in:
add a recipe and it gets valid structured data for free, in both locales.

- Built by `src/lib/structured-data.ts` (`recipeJsonLd`), injected into the
  `<head>` by `src/pages/[locale]/[...slug].astro` via the Base `head` slot.
- Field mapping: `title` → `name`, `servings` → `recipeYield`, `ingredients` →
  `recipeIngredient` (formatted lines), `method` → `recipeInstructions`
  (`HowToStep`s, with `[[refs]]` stripped), `prepTime`/`cookTime` → ISO 8601
  `prepTime`/`cookTime`/`totalTime`, `image` → absolute `image` URL, `tags` →
  `keywords`, `sourceUrl` → `isBasedOn`, category folder → `recipeCategory`,
  locale → `inLanguage`, site name → `author`. The Markdown body becomes
  `description`. Recognised `nutrition` keys map to `NutritionInformation`.
- Because it is frontmatter-driven, keeping the schema accurate is automatic;
  richer output just needs richer frontmatter (add `nutrition`, `tags`, etc.).

## Development

- `npm run dev` — local dev server (http://localhost:4321/recipes)
- `npm run validate` — type-check content against the schema **and** verify
  every recipe exists in all locales
- `npm run build` — production build
- `npm test` — unit tests for the scaling/duration/reference/i18n logic

The site (search, scaling, Cook Mode) is validated by the schema at build time,
so an incomplete recipe fails the build and the deploy. A recipe missing a
language fails `npm run validate`.

## Conventions

- Never commit directly to `main`; use a branch and a PR.
- Conventional Commits. Keep everything in English.
