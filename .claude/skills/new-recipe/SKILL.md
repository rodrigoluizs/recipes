---
name: new-recipe
description: Create a new recipe in this repository with the correct structure, then open the site locally in the browser to preview it before committing or opening a PR. Triggers on "new recipe", "add a recipe", "create recipe", "nova receita".
---

# New Recipe

Author a new recipe as structured Markdown — in **both English and Portuguese** —
and let the user preview it live before any commit/PR.

## Rules

- Every recipe exists in **both languages**: `en.md` and `pt.md`, side by side
  in the recipe folder. Validation (`npm run validate`) fails if either is
  missing.
- Author one language with the user (their choice), then translate it into the
  other; show the user the translation for review. Keep numbers and units
  identical across languages — only the human-readable text changes.
- Every recipe file MUST have: `title`, `servings`, `prepTime`, `cookTime`,
  `ingredients` (>= 1), `method` (>= 1).
- Ingredients are structured: `{ amount?, unit?, name, note? }`.
  - `amount` is a number; omit it for non-scalable items ("to taste").
  - `unit` is optional ("g", "ml", "tsp"); omit for countable items (eggs).
  - `note` is a muted clarifier shown after the name ("grated", "to taste").
- In `method` steps, reference an ingredient with `[[name]]` where `name`
  matches an ingredient's `name` exactly (case-insensitive) **in that same
  file**. Since ingredient names are translated, the `[[refs]]` in `pt.md` must
  match the Portuguese names, and those in `en.md` the English names. These
  render highlighted and tappable to show the (scaled) quantity.
- A step containing `: ` (colon + space) must be wrapped in quotes in YAML.

## Steps

1. **Interview** the user, one topic at a time, to collect:
   - Title, and category (an existing folder under `recipes/` or a new one).
   - Servings (integer), prep time, cook time (free text like "40 min").
   - Ingredients (amount / unit / name / optional note).
   - Method steps. Offer to add `[[name]]` references for ingredients used.
   - Optional: photo, source URL (`sourceUrl`), tags, nutrition, body notes.

2. **Derive the slug** from the **English** title (language-neutral, shared by
   both files): lowercase, spaces → `-`, strip anything that is not `a-z0-9-`.
   Example: "Chocolate Brownie" → `chocolate-brownie`. The folder is
   `recipes/<category>/<slug>/`.

3. **Write both files** into `recipes/<category>/<slug>/`:
   - `en.md` — the English version.
   - `pt.md` — the Portuguese version (translate title, ingredient names/notes,
     method, tags, and body; keep amounts/units the same; re-point every
     `[[ref]]` at the Portuguese ingredient names).
   Use the template below for each. If the user has a photo, save it once in the
   folder and set `image: ./<filename>` in both files; otherwise omit `image`
   (a gradient fallback is used). The photo is shared across languages.

4. **Validate**: run `npm run validate`. This type-checks both files and fails if
   either language is missing. Fix any schema errors (missing required fields,
   wrong types) before continuing. Also confirm no build warning about unmatched
   `[[name]]` references (each file's names must match its own ingredients).

5. **Preview**: start the dev server in the background and open the browser to
   the new recipe in both languages:

   ```bash
   npm run dev &
   # wait for "http://localhost:4321" then:
   open "http://localhost:4321/recipes/en/<category>/<slug>"
   open "http://localhost:4321/recipes/pt/<category>/<slug>"
   ```

   Tell the user to review both languages (check the card on the home page, the
   ingredient list, method references, scaling, Cook Mode, and the EN/PT toggle).

6. **Wait for the user's confirmation.** Only after they are happy, offer to
   commit and open a PR (use the commit-and-pr flow; never commit to `main`).

## Template

Use this for both `en.md` and `pt.md` (translated content, identical structure):

```markdown
---
title: <Title>
servings: <number>
prepTime: <e.g. 20 min>
cookTime: <e.g. 30 min>
ingredients:
  - amount: <number>
    unit: <unit>            # omit if none
    name: <name>
    note: <clarifier>       # omit if none
  - name: <name>            # non-scalable item
    note: to taste
method:
  - <Step, referencing ingredients like [[name]].>
  - "<Step with a colon: wrap the whole step in quotes.>"
image: ./<photo>            # optional
sourceUrl: <url>            # optional
tags: [<tag>, <tag>]        # optional
nutrition:                  # optional, free-form key/value
  calories: <number>
---

<Optional free-text notes / tips.>
```
