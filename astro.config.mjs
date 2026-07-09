// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// Project page served from https://rodrigoluizs.github.io/recipes
export default defineConfig({
  site: 'https://rodrigoluizs.github.io',
  base: '/recipes',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [icon()],
});
