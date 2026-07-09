// @ts-check
import { defineConfig } from 'astro/config';

// Project page served from https://rodrigoluizs.github.io/recipes
export default defineConfig({
  site: 'https://rodrigoluizs.github.io',
  base: '/recipes',
  output: 'static',
  trailingSlash: 'ignore',
});
