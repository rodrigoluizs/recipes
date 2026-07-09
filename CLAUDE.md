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
- **Ingredients** — `ingredients` (list, >= 1)
- **Method** — `method` (list of steps, >= 1)

Optional:

- **Photos** — `image` (relative path, e.g. `./brownie.jpg`)
- **Website** — `sourceUrl` (URL of the original recipe)
- **Nutrition** — `nutrition` (free-form key/value)
- `tags` (list) and free-text notes in the Markdown body

### Ingredient shape

Each ingredient is structured so quantities can be scaled and referenced:

```yaml
- amount: 250      # number; omit for non-scalable items ("to taste")
  unit: g          # optional; omit for countable items (eggs)
  name: cheese     # required; referenced from steps via [[cheese]]
  note: grated     # optional muted clarifier shown after the name
```

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
  - amount: 200
    unit: g
    name: dark chocolate
  - amount: 3
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
