import { DEFAULT_LOCALE, type Locale } from '../i18n/config';

/**
 * Canonical ingredient database.
 *
 * Each entry has a locale-neutral `id` (the shared identity used to merge
 * quantities in the shopping list, even across languages and recipes) and a
 * display name per locale. Recipes reference an `id`; the inline recipe `name`
 * stays free to be contextual (e.g. "pasteurized whole milk") while the id ties
 * it back to the canonical ingredient ("whole milk").
 *
 * Granularity is the guard against conflating similar-but-different products:
 * things that a shopper buys separately get separate ids (`milk` vs
 * `whole-milk`, `baking-powder` vs `dry-yeast`, `salt` vs `coarse-salt`,
 * `tomato-passata` vs `tomato-sauce`). When adding a recipe, reuse an existing
 * id if the ingredient is truly the same product; otherwise add a new entry.
 *
 * `satisfies Record<...>` makes TypeScript require every id to define all
 * locales, so `npm run validate` fails on a partial entry.
 */
export const INGREDIENTS = {
  '00-pizza-flour': { en: '00 pizza flour', pt: 'farinha de pizza 00' },
  'baking-powder': { en: 'baking powder', pt: 'fermento em pó' },
  'baking-soda': { en: 'baking soda', pt: 'bicarbonato de sódio' },
  basil: { en: 'basil', pt: 'manjericão' },
  'black-pepper': { en: 'black pepper', pt: 'pimenta preta' },
  'brown-sugar': { en: 'brown sugar', pt: 'açúcar mascavo' },
  bucatini: { en: 'bucatini', pt: 'bucatini' },
  'calcium-chloride': { en: 'calcium chloride', pt: 'cloridrato de cálcio' },
  'canned-corn': { en: 'canned corn', pt: 'milho em lata' },
  carrot: { en: 'carrots', pt: 'cenouras' },
  celery: { en: 'celery', pt: 'salsão' },
  'chicken-breast': { en: 'chicken breast', pt: 'peito de frango' },
  'coarse-corn-flour': { en: 'coarse corn flour', pt: 'flocão de milho' },
  'coarse-salt': { en: 'coarse salt', pt: 'sal grosso' },
  'cocoa-powder': { en: 'cocoa powder', pt: 'cacau em pó' },
  'condensed-milk': { en: 'sweetened condensed milk', pt: 'leite condensado' },
  'dark-chocolate': { en: 'dark chocolate', pt: 'chocolate amargo' },
  'dry-yeast': { en: 'dry yeast', pt: 'fermento seco' },
  'dulce-de-leche': { en: 'dulce de leche', pt: 'doce de leite' },
  egg: { en: 'eggs', pt: 'ovos' },
  garlic: { en: 'garlic', pt: 'alho' },
  guanciale: { en: 'guanciale', pt: 'guanciale' },
  'ground-beef': { en: 'ground beef', pt: 'carne moída' },
  'liquid-rennet': { en: 'liquid rennet', pt: 'coagulante líquido' },
  margarine: { en: 'margarine', pt: 'margarina' },
  milk: { en: 'milk', pt: 'leite' },
  'milk-chocolate': { en: 'milk chocolate', pt: 'chocolate ao leite' },
  mozzarella: { en: 'mozzarella', pt: 'mussarela' },
  oil: { en: 'oil', pt: 'óleo' },
  'olive-oil': { en: 'olive oil', pt: 'azeite de oliva' },
  onion: { en: 'onion', pt: 'cebola' },
  parmesan: { en: 'parmesan cheese', pt: 'queijo parmesão' },
  parsley: { en: 'parsley', pt: 'salsinha' },
  'peeled-tomatoes': { en: 'peeled tomatoes', pt: 'tomate pelado' },
  'pecorino-romano': { en: 'pecorino romano', pt: 'pecorino romano' },
  potato: { en: 'potatoes', pt: 'batatas' },
  'red-wine': { en: 'red wine', pt: 'vinho tinto' },
  salt: { en: 'salt', pt: 'sal' },
  semolina: { en: 'semolina', pt: 'sêmola' },
  'semi-cured-cheese': { en: 'semi-cured cheese', pt: 'queijo meia cura' },
  'shredded-coconut': { en: 'shredded coconut', pt: 'coco ralado' },
  'sour-cassava-starch': { en: 'sour cassava starch', pt: 'polvilho azedo' },
  'soybean-oil': { en: 'soybean oil', pt: 'óleo de soja' },
  spaghetti: { en: 'spaghetti', pt: 'espaguete' },
  'sweet-cassava-starch': { en: 'sweet cassava starch', pt: 'polvilho doce' },
  tomato: { en: 'tomatoes', pt: 'tomates' },
  'tomato-passata': { en: 'tomato passata', pt: 'passata de tomate' },
  'tomato-paste': { en: 'tomato paste', pt: 'pasta de tomate' },
  'tomato-sauce': { en: 'tomato sauce', pt: 'molho de tomate' },
  'unsalted-butter': { en: 'unsalted butter', pt: 'manteiga sem sal' },
  'vanilla-extract': { en: 'vanilla extract', pt: 'extrato de baunilha' },
  water: { en: 'water', pt: 'água' },
  'wheat-flour': { en: 'all-purpose flour', pt: 'farinha de trigo' },
  'white-rice': { en: 'white rice', pt: 'arroz branco' },
  'white-sugar': { en: 'granulated sugar', pt: 'açúcar refinado' },
  'white-wine': { en: 'white wine', pt: 'vinho branco' },
  'whole-milk': { en: 'whole milk', pt: 'leite integral' },
} satisfies Record<string, Record<Locale, string>>;

/** A valid canonical ingredient id (a key of {@link INGREDIENTS}). */
export type IngredientId = keyof typeof INGREDIENTS;

/** Type guard narrowing an arbitrary string to a known ingredient id. */
export function isIngredientId(value: string): value is IngredientId {
  return Object.prototype.hasOwnProperty.call(INGREDIENTS, value);
}

/**
 * Canonical display name for an id in the given locale. Falls back to the
 * default locale, then to the raw id, so an unknown id never renders blank.
 */
export function ingredientName(id: string, locale: Locale): string {
  const entry = (INGREDIENTS as Record<string, Record<Locale, string>>)[id];
  if (!entry) return id;
  return entry[locale] ?? entry[DEFAULT_LOCALE] ?? id;
}
