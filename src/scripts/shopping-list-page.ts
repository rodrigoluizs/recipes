import { formatQuantity } from '../lib/quantity';
import {
  addManualItem,
  clearChecked,
  lineKey,
  removeLine,
  setChecked,
  type ShoppingLine,
} from '../lib/shopping-list';
import { loadList, saveList, updateBadges } from './shopping-store';

interface PageData {
  /** Canonical id -> display name in the current locale. */
  names: Record<string, string>;
  t: { empty: string; hint: string; confirmEmpty: string };
}

const dataEl = document.getElementById('shopping-data');
if (dataEl?.textContent) {
  init(JSON.parse(dataEl.textContent) as PageData);
}

function init(page: PageData): void {
  const listEl = document.getElementById('list') as HTMLUListElement | null;
  const emptyEl = document.getElementById('empty');
  const hintEl = document.getElementById('list-hint');
  const actionsEl = document.getElementById('actions');
  const form = document.getElementById('manual-form') as HTMLFormElement | null;
  const input = document.getElementById('manual-input') as HTMLInputElement | null;
  if (!listEl) return;

  /** Human label for a line: canonical name (recipe) or raw text (manual). */
  function label(line: ShoppingLine): string {
    return line.kind === 'manual'
      ? line.text
      : (page.names[line.id] ?? line.id);
  }

  function render(): void {
    const list = loadList();
    listEl!.replaceChildren();

    for (const line of list.items) {
      const key = lineKey(line);
      const li = document.createElement('li');
      if (line.checked) li.classList.add('checked');
      li.dataset.key = key;

      const tick = document.createElement('input');
      tick.type = 'checkbox';
      tick.className = 'tick';
      tick.checked = line.checked;
      tick.setAttribute('aria-label', label(line));

      const body = document.createElement('span');
      body.className = 'body';
      if (line.kind === 'recipe' && line.amount !== undefined) {
        const qty = document.createElement('span');
        qty.className = 'qty';
        qty.textContent = formatQuantity({ amount: line.amount, unit: line.unit });
        body.appendChild(qty);
      }
      body.appendChild(document.createTextNode(label(line)));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.dataset.remove = key;
      remove.setAttribute('aria-label', `✕ ${label(line)}`);
      remove.textContent = '✕';

      li.append(tick, body, remove);
      listEl!.appendChild(li);
    }

    const has = list.items.length > 0;
    if (emptyEl) emptyEl.hidden = has;
    if (hintEl) hintEl.hidden = !has;
    if (actionsEl) actionsEl.hidden = !has;
    updateBadges(list);
  }

  // Toggle "already have" from anywhere on the row except the remove button.
  listEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-remove]')) return;
    const li = target.closest<HTMLElement>('li[data-key]');
    if (!li?.dataset.key) return;
    const key = li.dataset.key;
    const line = loadList().items.find((it) => lineKey(it) === key);
    if (!line) return;
    saveList(setChecked(loadList(), key, !line.checked));
    render();
  });

  listEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove]');
    if (!btn?.dataset.remove) return;
    saveList(removeLine(loadList(), btn.dataset.remove));
    render();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input?.value.trim()) return;
    saveList(addManualItem(loadList(), input.value));
    input.value = '';
    render();
  });

  document.querySelector('[data-clear-checked]')?.addEventListener('click', () => {
    saveList(clearChecked(loadList()));
    render();
  });

  document.querySelector('[data-empty-list]')?.addEventListener('click', () => {
    if (confirm(page.t.confirmEmpty)) {
      saveList({ v: 1, items: [] });
      render();
    }
  });

  // Re-render if another tab changes the list.
  window.addEventListener('storage', (e) => {
    if (e.key === 'recipes:shopping-list') render();
  });

  render();
}
