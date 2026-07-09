---
name: new-recipe
description: Create a new recipe in this repository with the correct structure, then open the site locally in the browser to preview it before committing or opening a PR. Triggers on "new recipe", "add a recipe", "create recipe", "nova receita".
---

# New Recipe

Author a new recipe as a structured Markdown file and let the user preview it
live before any commit/PR.

## Rules

- All recipe content is written in **English**.
- Every recipe MUST have: `title`, `servings`, `prepTime`, `cookTime`,
  `ingredients` (>= 1), `method` (>= 1).
- Ingredients are structured: `{ amount?, unit?, name, note? }`.
  - `amount` is a number; omit it for non-scalable items ("to taste").
  - `unit` is optional ("g", "ml", "tsp"); omit for countable items (eggs).
  - `note` is a muted clarifier shown after the name ("grated", "to taste").
- In `method` steps, reference an ingredient with `[[name]]` where `name`
  matches an ingredient's `name` exactly (case-insensitive). These render
  highlighted and tappable to show the (scaled) quantity.
- A step containing `: ` (colon + space) must be wrapped in quotes in YAML.

## Steps

1. **Interview** the user, one topic at a time, to collect:
   - Title, and category (an existing folder under `recipes/` or a new one).
   - Servings (integer), prep time, cook time (free text like "40 min").
   - Ingredients (amount / unit / name / optional note).
   - Method steps. Offer to add `[[name]]` references for ingredients used.
   - Optional: photo, source URL (`sourceUrl`), tags, nutrition, body notes.

2. **Derive the slug** from the title: lowercase, spaces → `-`, strip anything
   that is not `a-z0-9-`. Example: "Chocolate Brownie" → `chocolate-brownie`.

3. **Write** the file to `recipes/<category>/<slug>/index.md` using the template
   below. If the user has a photo, save it in the same folder and set
   `image: ./<filename>`; otherwise omit `image` (a gradient fallback is used).

4. **Validate**: run `npm run validate`. Fix any schema errors (missing required
   fields, wrong types) before continuing. Also confirm no build warning about
   unmatched `[[name]]` references (the names must match ingredients).

5. **Preview**: start the dev server in the background and open the browser to
   the new recipe:

   ```bash
   npm run dev &
   # wait for "http://localhost:4321" then:
   open "http://localhost:4321/recipes/<category>/<slug>"
   ```

   Tell the user to review the recipe (check the card on the home page, the
   ingredient list, method references, scaling, and Cook Mode).

6. **Wait for the user's confirmation.** Only after they are happy, offer to
   commit and open a PR (use the commit-and-pr flow; never commit to `main`).

## Template

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
