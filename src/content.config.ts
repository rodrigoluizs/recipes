import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Recipes live as `recipes/<category>/<slug>/index.md`. The entry id is the
 * folder path (e.g. "desserts/chocolate-brownie"), which doubles as the URL
 * slug and encodes the category as its first segment.
 */
const recipes = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './recipes',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
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
