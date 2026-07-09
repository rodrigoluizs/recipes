import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Recipes live as `recipes/<category>/<slug>/<locale>.md` (e.g.
 * `desserts/chocolate-brownie/en.md`). The entry id is the path without the
 * extension (e.g. "desserts/chocolate-brownie/en"): its first segment is the
 * category, the last is the locale, and the middle is the shared recipe key
 * that doubles as the URL slug.
 */
const recipes = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './recipes',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      servings: z.number().int().positive(),
      prepTime: z.string(),
      cookTime: z.string(),
      ingredients: z
        .array(
          z.object({
            amount: z.number().optional(),
            unit: z.string().optional(),
            name: z.string(),
            note: z.string().optional(),
          }),
        )
        .min(1),
      method: z.array(z.string()).min(1),
      image: image().optional(),
      sourceUrl: z.url().optional(),
      tags: z.array(z.string()).default([]),
      nutrition: z
        .record(z.string(), z.union([z.string(), z.number()]))
        .optional(),
    }),
});

export const collections = { recipes };
