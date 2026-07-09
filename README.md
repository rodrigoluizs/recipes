# Recipes

A personal recipe collection stored as Markdown, with a modern dark website to
browse, scale, and cook from the recipes. Built with [Astro](https://astro.build)
and deployed automatically to GitHub Pages.

**Live site:** https://rodrigoluizs.github.io/recipes

## Features

- 🔍 Searchable card grid, filterable by category and tag
- 🍳 **Cook Mode** — a hands-free, step-by-step walkthrough (keeps the screen awake)
- ⚖️ **Scaling** — resize a recipe by servings or by how much of one ingredient
  you have; every quantity updates live
- 🔗 Tap an ingredient in a step to see its (scaled) quantity

## Adding a recipe

Recipes live at `recipes/<category>/<slug>/index.md`, one folder per recipe with
its photos alongside. See [`CLAUDE.md`](./CLAUDE.md) for the full structure.

The easiest way is the **`new-recipe`** skill (Claude Code), which interviews you
for the fields, writes the file correctly, and opens a local preview.

Minimal example:

```markdown
---
title: Fresh Pasta
servings: 4
prepTime: 22 min
cookTime: 5 min
ingredients:
  - amount: 400
    unit: g
    name: 00 flour
  - amount: 4
    name: eggs
method:
  - Mound the [[00 flour]] and make a well.
  - Crack in the [[eggs]] and beat with a fork.
tags: [pasta, italian]
---
```

## Development

```bash
npm install
npm run dev        # http://localhost:4321/recipes
npm run validate   # type-check content against the schema
npm run build      # production build
npm test           # unit tests (scaling / durations / references)
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which validates,
builds, and publishes to GitHub Pages. Pages source must be set to
**GitHub Actions** in the repository settings.
