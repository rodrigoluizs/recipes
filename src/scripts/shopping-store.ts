import {
  emptyList,
  uncheckedCount,
  type ShoppingList,
} from '../lib/shopping-list';

/**
 * Client-side persistence for the shopping list. Keeps the DOM/storage glue out
 * of `src/lib/shopping-list.ts` (which stays pure and unit-tested).
 *
 * The list lives in `localStorage` so it survives reloads and works offline in
 * the installed PWA. Writes broadcast a same-tab event (and `localStorage`
 * already fires `storage` in *other* tabs) so cart badges stay in sync.
 */
const KEY = 'recipes:shopping-list';
const CHANGED_EVENT = 'shopping-list:changed';

export function loadList(): ShoppingList {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyList();
    const parsed = JSON.parse(raw) as ShoppingList;
    if (parsed?.v === 1 && Array.isArray(parsed.items)) return parsed;
  } catch {
    /* corrupt or unavailable storage — start fresh */
  }
  return emptyList();
}

export function saveList(list: ShoppingList): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked/full — nothing else we can do */
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  updateBadges(list);
}

/** Reflect the unchecked-item count onto every cart badge on the page. */
export function updateBadges(list: ShoppingList = loadList()): void {
  const count = uncheckedCount(list);
  for (const badge of document.querySelectorAll<HTMLElement>('[data-cart-count]')) {
    badge.textContent = count > 0 ? String(count) : '';
    badge.hidden = count === 0;
  }
}

/** Keep badges live: initial paint + same-tab and cross-tab updates. */
export function initCartBadges(): void {
  updateBadges();
  window.addEventListener(CHANGED_EVENT, () => updateBadges());
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) updateBadges();
  });
}
