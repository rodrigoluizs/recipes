import { describe, it, expect } from 'vitest';
import {
  emptyList,
  addRecipeIngredients,
  addManualItem,
  setChecked,
  removeLine,
  clearChecked,
  uncheckedCount,
  lineKey,
  type RecipeLine,
} from './shopping-list';

const recipeLine = (list: ReturnType<typeof emptyList>, id: string, unit?: string) =>
  list.items.find(
    (it): it is RecipeLine =>
      it.kind === 'recipe' && it.id === id && it.unit === unit,
  );

describe('addRecipeIngredients', () => {
  it('scales amounts by the factor at add time', () => {
    const list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 2);
    expect(recipeLine(list, 'milk', 'ml')?.amount).toBe(600);
  });

  it('sums amounts for the same id + unit', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 1);
    list = addRecipeIngredients(list, [{ id: 'milk', unit: 'ml', amount: 200 }], 1);
    expect(list.items).toHaveLength(1);
    expect(recipeLine(list, 'milk', 'ml')?.amount).toBe(500);
  });

  it('merges the same id across different recipes and languages via the id', () => {
    // "leite" (pt) and "milk" (en) both carry id `milk` — they collapse.
    let list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 1);
    list = addRecipeIngredients(list, [{ id: 'milk', unit: 'ml', amount: 100 }], 1);
    expect(list.items).toHaveLength(1);
    expect(recipeLine(list, 'milk', 'ml')?.amount).toBe(400);
  });

  it('keeps different units of the same id as separate lines', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 1);
    list = addRecipeIngredients(list, [{ id: 'milk', unit: 'l', amount: 1 }], 1);
    expect(list.items).toHaveLength(2);
    expect(recipeLine(list, 'milk', 'ml')?.amount).toBe(300);
    expect(recipeLine(list, 'milk', 'l')?.amount).toBe(1);
  });

  it('sums scaled amounts (scale then add)', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 2); // 600
    list = addRecipeIngredients(list, [{ id: 'milk', unit: 'ml', amount: 300 }], 0.5); // 150
    expect(recipeLine(list, 'milk', 'ml')?.amount).toBe(750);
  });

  it('handles "to taste" items (no amount, no unit) as one line', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'salt' }], 1);
    list = addRecipeIngredients(list, [{ id: 'salt' }], 4);
    expect(list.items).toHaveLength(1);
    expect(recipeLine(list, 'salt', undefined)?.amount).toBeUndefined();
  });

  it('keeps a measured item separate from a to-taste item of the same id', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'salt' }], 1);
    list = addRecipeIngredients(list, [{ id: 'salt', unit: 'g', amount: 100 }], 1);
    expect(list.items).toHaveLength(2);
  });

  it('does not mutate the input list', () => {
    const before = emptyList();
    const after = addRecipeIngredients(before, [{ id: 'milk', unit: 'ml', amount: 300 }], 1);
    expect(before.items).toHaveLength(0);
    expect(after.items).toHaveLength(1);
  });
});

describe('addManualItem', () => {
  it('adds a free-text line', () => {
    const list = addManualItem(emptyList(), 'paper towels');
    expect(list.items).toEqual([{ kind: 'manual', text: 'paper towels', checked: false }]);
  });

  it('ignores blank input', () => {
    expect(addManualItem(emptyList(), '   ').items).toHaveLength(0);
  });

  it('dedupes case/whitespace-insensitively', () => {
    let list = addManualItem(emptyList(), 'Paper Towels');
    list = addManualItem(list, '  paper   towels ');
    expect(list.items).toHaveLength(1);
  });

  it('never merges a manual item with a recipe item', () => {
    let list = addRecipeIngredients(emptyList(), [{ id: 'milk', unit: 'ml', amount: 300 }], 1);
    list = addManualItem(list, 'milk');
    expect(list.items).toHaveLength(2);
  });
});

describe('checking and clearing', () => {
  it('toggles checked by key', () => {
    let list = addManualItem(emptyList(), 'eggs');
    const key = lineKey(list.items[0]);
    list = setChecked(list, key, true);
    expect(list.items[0].checked).toBe(true);
    list = setChecked(list, key, false);
    expect(list.items[0].checked).toBe(false);
  });

  it('removes a single line by key', () => {
    let list = addManualItem(addManualItem(emptyList(), 'a'), 'b');
    list = removeLine(list, lineKey(list.items[0]));
    expect(list.items.map((it) => (it as { text: string }).text)).toEqual(['b']);
  });

  it('clears only checked lines', () => {
    let list = addManualItem(addManualItem(emptyList(), 'a'), 'b');
    list = setChecked(list, lineKey(list.items[0]), true);
    list = clearChecked(list);
    expect(list.items).toHaveLength(1);
    expect((list.items[0] as { text: string }).text).toBe('b');
  });

  it('counts unchecked lines for the badge', () => {
    let list = addManualItem(addManualItem(emptyList(), 'a'), 'b');
    expect(uncheckedCount(list)).toBe(2);
    list = setChecked(list, lineKey(list.items[0]), true);
    expect(uncheckedCount(list)).toBe(1);
  });
});
