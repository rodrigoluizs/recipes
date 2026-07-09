import { DEFAULT_LOCALE, type Locale } from './config';

/**
 * User-facing UI strings per locale. Recipe *content* lives in the Markdown
 * files; this dictionary only covers the site chrome (labels, buttons, hints).
 *
 * `en` is the complete reference set; every other locale must provide the same
 * keys. The `t()` helper falls back to `en` for any missing string so a partial
 * translation degrades gracefully rather than rendering `undefined`.
 */
export interface UIStrings {
  siteName: string;
  allRecipes: string;
  searchPlaceholder: string;
  filterAll: string;
  noRecipesYet: string;
  noRecipesMatch: string;
  servings: string;
  prep: string;
  cook: string;
  total: string;
  totalTitle: string;
  ingredients: string;
  method: string;
  nutrition: string;
  nutritionNote: string; // "Per original serving ({n} servings)." — {n} placeholder
  start: string;
  scale: string;
  scaleMode: string;
  modeAmount: string;
  modeServing: string;
  modeIngredient: string;
  scaleHint: string;
  resetToOriginal: string;
  select: string;
  scaleAriaLabel: string;
  scaleValueAriaLabel: string;
  scalingModeAriaLabel: string;
  backToRecipes: string;
  shareRecipe: string;
  linkCopied: string;
  viewOriginalSource: string;
  cookModeLabel: string;
  exitCookMode: string;
  stepOf: string; // "Step {n} of {m}" — {n}/{m} placeholders
  previous: string;
  next: string;
  done: string;
  chooseLanguage: string;
  durHr: string;
  durMin: string;
}

export const ui: Record<Locale, UIStrings> = {
  en: {
    siteName: "Rodrigo's Kitchen",
    allRecipes: 'All Recipes',
    searchPlaceholder: 'Recipes, Ingredients and More',
    filterAll: 'All',
    noRecipesYet: 'No recipes yet — add your first one.',
    noRecipesMatch: 'No recipes match your search.',
    servings: 'servings',
    prep: 'Prep',
    cook: 'Cook',
    total: 'Total',
    totalTitle: 'Total time',
    ingredients: 'Ingredients',
    method: 'Method',
    nutrition: 'Nutrition',
    nutritionNote: 'Per original serving ({n} servings).',
    start: 'Start',
    scale: 'Scale',
    scaleMode: 'Scale',
    modeAmount: 'amount',
    modeServing: 'serving',
    modeIngredient: 'ingredient',
    scaleHint: 'Tap an ingredient below to scale by it.',
    resetToOriginal: 'Reset to original',
    select: 'Select',
    scaleAriaLabel: 'Scale',
    scaleValueAriaLabel: 'Scale value',
    scalingModeAriaLabel: 'Scaling mode',
    backToRecipes: 'Back to all recipes',
    shareRecipe: 'Share recipe',
    linkCopied: 'Link copied to clipboard',
    viewOriginalSource: 'View original source ↗',
    cookModeLabel: 'Cook mode',
    exitCookMode: 'Exit cook mode',
    stepOf: 'Step {n} of {m}',
    previous: 'Previous',
    next: 'Next',
    done: 'Done',
    chooseLanguage: 'Choose language',
    durHr: 'hr',
    durMin: 'min',
  },
  pt: {
    siteName: 'Cozinha do Rodrigo',
    allRecipes: 'Todas as Receitas',
    searchPlaceholder: 'Receitas, ingredientes e mais',
    filterAll: 'Todas',
    noRecipesYet: 'Nenhuma receita ainda — adicione a primeira.',
    noRecipesMatch: 'Nenhuma receita corresponde à busca.',
    servings: 'porções',
    prep: 'Preparo',
    cook: 'Cozimento',
    total: 'Total',
    totalTitle: 'Tempo total',
    ingredients: 'Ingredientes',
    method: 'Modo de preparo',
    nutrition: 'Informação nutricional',
    nutritionNote: 'Por porção original ({n} porções).',
    start: 'Começar',
    scale: 'Ajustar',
    scaleMode: 'Ajustar',
    modeAmount: 'quantidade',
    modeServing: 'porção',
    modeIngredient: 'ingrediente',
    scaleHint: 'Toque em um ingrediente abaixo para ajustar por ele.',
    resetToOriginal: 'Voltar ao original',
    select: 'Selecionar',
    scaleAriaLabel: 'Ajustar',
    scaleValueAriaLabel: 'Valor do ajuste',
    scalingModeAriaLabel: 'Modo de ajuste',
    backToRecipes: 'Voltar para todas as receitas',
    shareRecipe: 'Compartilhar receita',
    linkCopied: 'Link copiado para a área de transferência',
    viewOriginalSource: 'Ver fonte original ↗',
    cookModeLabel: 'Modo cozinha',
    exitCookMode: 'Sair do modo cozinha',
    stepOf: 'Passo {n} de {m}',
    previous: 'Anterior',
    next: 'Próximo',
    done: 'Concluir',
    chooseLanguage: 'Escolher idioma',
    durHr: 'h',
    durMin: 'min',
  },
};

/** Category display labels per locale, keyed by the category id (folder name). */
const categoryLabels: Record<Locale, Record<string, string>> = {
  en: {
    desserts: 'Desserts',
    mains: 'Mains',
    snacks: 'Snacks',
  },
  pt: {
    desserts: 'Sobremesas',
    mains: 'Pratos Principais',
    snacks: 'Lanches',
  },
};

/** The UI dictionary for a locale (with `en` as the fallback source). */
export function t(locale: Locale): UIStrings {
  return { ...ui[DEFAULT_LOCALE], ...ui[locale] };
}

/** Interpolate `{key}` placeholders in a template string. */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

/**
 * Localized category label. Falls back to the default locale's map, then to
 * title-casing the id so a brand-new category still renders sensibly.
 */
export function categoryLabel(category: string, locale: Locale): string {
  return (
    categoryLabels[locale]?.[category] ??
    categoryLabels[DEFAULT_LOCALE]?.[category] ??
    category
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}
