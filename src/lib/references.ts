import type { Ingredient } from './types';

export type StepToken =
  | { type: 'text'; value: string }
  | { type: 'ref'; name: string };

const REF_RE = /\[\[([^\]]+)\]\]/g;

/**
 * Split a method step into text and ingredient-reference tokens.
 * "Melt the [[dark chocolate]]." -> [text "Melt the ", ref "dark chocolate", text "."]
 */
export function parseStep(step: string): StepToken[] {
  const tokens: StepToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(step))) {
    if (m.index > last) {
      tokens.push({ type: 'text', value: step.slice(last, m.index) });
    }
    tokens.push({ type: 'ref', name: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < step.length) {
    tokens.push({ type: 'text', value: step.slice(last) });
  }
  return tokens;
}

/** Resolve a reference name to an ingredient (case-insensitive), or null. */
export function resolveRef(
  name: string,
  ingredients: Ingredient[],
): Ingredient | null {
  const needle = name.trim().toLowerCase();
  return (
    ingredients.find((i) => i.name.trim().toLowerCase() === needle) ?? null
  );
}

/**
 * Return the unique reference names in `method` that do not match any
 * ingredient. Used to warn at build time.
 */
export function validateSteps(
  method: string[],
  ingredients: Ingredient[],
): string[] {
  const unmatched = new Set<string>();
  for (const step of method) {
    for (const token of parseStep(step)) {
      if (token.type === 'ref' && !resolveRef(token.name, ingredients)) {
        unmatched.add(token.name);
      }
    }
  }
  return [...unmatched];
}
