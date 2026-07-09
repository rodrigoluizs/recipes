import { scaleAmount, formatQuantity } from '../lib/quantity';

interface ClientIngredient {
  amount?: number;
  unit?: string;
  name: string;
  note?: string;
}

interface RecipeClientData {
  baseServings: number;
  /** Keyed by lowercased ingredient name. */
  ingredients: Record<string, ClientIngredient>;
}

const dataEl = document.getElementById('recipe-data');
if (dataEl?.textContent) {
  init(JSON.parse(dataEl.textContent) as RecipeClientData);
}

function init(data: RecipeClientData): void {
  const { baseServings } = data;
  let factor = 1;

  const qtyEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-qty]'),
  );
  const servingsEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-servings]'),
  );
  const servingsInput = document.getElementById(
    'scale-servings',
  ) as HTMLInputElement | null;

  /** Recompute every displayed quantity from the current factor. */
  function applyScale(next: number, updateInput = true): void {
    factor = next > 0 && Number.isFinite(next) ? next : 1;

    for (const el of qtyEls) {
      const base = parseFloat(el.dataset.amount ?? '');
      if (Number.isNaN(base)) continue;
      const unit = el.dataset.unit || undefined;
      el.textContent = formatQuantity({ amount: scaleAmount(base, factor), unit });
    }

    const scaledServings = Math.max(1, Math.round(baseServings * factor));
    for (const el of servingsEls) el.textContent = String(scaledServings);
    if (updateInput && servingsInput) servingsInput.value = String(scaledServings);

    const url = new URL(location.href);
    if (Math.abs(factor - 1) < 1e-9) url.searchParams.delete('servings');
    else url.searchParams.set('servings', String(scaledServings));
    history.replaceState(null, '', url);
  }

  // --- Scale panel toggle -------------------------------------------------
  const scaleToggle = document.querySelector<HTMLButtonElement>('[data-scale-toggle]');
  const scalePanel = document.getElementById('scale-panel');
  scaleToggle?.addEventListener('click', () => {
    if (scalePanel) scalePanel.hidden = !scalePanel.hidden;
  });

  // --- Scale by servings --------------------------------------------------
  function setServings(value: number): void {
    if (value > 0) applyScale(value / baseServings, false);
  }
  servingsInput?.addEventListener('input', () =>
    setServings(parseFloat(servingsInput.value)),
  );
  document
    .querySelector('[data-servings-inc]')
    ?.addEventListener('click', () => {
      const current = Math.round(baseServings * factor);
      applyScale((current + 1) / baseServings);
    });
  document
    .querySelector('[data-servings-dec]')
    ?.addEventListener('click', () => {
      const current = Math.round(baseServings * factor);
      applyScale(Math.max(1, current - 1) / baseServings);
    });

  // --- Scale by ingredient ------------------------------------------------
  const ingredientSelect = document.getElementById(
    'scale-ingredient',
  ) as HTMLSelectElement | null;
  const haveInput = document.getElementById(
    'scale-have',
  ) as HTMLInputElement | null;
  const haveUnit = document.getElementById('scale-have-unit');

  function syncHaveUnit(): void {
    const opt = ingredientSelect?.selectedOptions[0];
    if (haveUnit) haveUnit.textContent = opt?.dataset.unit ?? '';
  }
  syncHaveUnit();
  ingredientSelect?.addEventListener('change', syncHaveUnit);

  haveInput?.addEventListener('input', () => {
    const opt = ingredientSelect?.selectedOptions[0];
    const base = parseFloat(opt?.dataset.amount ?? '');
    const have = parseFloat(haveInput.value);
    if (!Number.isNaN(base) && base > 0 && !Number.isNaN(have) && have > 0) {
      applyScale(have / base);
    }
  });

  document
    .querySelector('[data-scale-reset]')
    ?.addEventListener('click', () => {
      applyScale(1);
      if (haveInput) haveInput.value = '';
    });

  // --- Ingredient reference popover (page + cook mode) --------------------
  const popover = document.createElement('div');
  popover.className = 'ingredient-popover';
  popover.hidden = true;
  document.body.appendChild(popover);

  function hidePopover(): void {
    popover.hidden = true;
  }
  function showPopover(target: HTMLElement, name: string): void {
    const ing = data.ingredients[name.trim().toLowerCase()];
    if (!ing) return;
    const qty =
      ing.amount !== undefined
        ? formatQuantity({ amount: scaleAmount(ing.amount, factor), unit: ing.unit })
        : (ing.note ?? '');
    popover.textContent = qty ? `${qty} ${ing.name}` : ing.name;
    popover.hidden = false;
    const r = target.getBoundingClientRect();
    const top = r.top - popover.offsetHeight - 8;
    popover.style.top = `${(top < 8 ? r.bottom + 8 : top) + window.scrollY}px`;
    popover.style.left = `${Math.max(8, r.left + window.scrollX)}px`;
  }

  document.addEventListener('click', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>('.ref');
    if (ref) {
      e.preventDefault();
      showPopover(ref, ref.dataset.ingredient ?? ref.textContent ?? '');
    } else if (!popover.contains(e.target as Node)) {
      hidePopover();
    }
  });
  window.addEventListener('scroll', hidePopover, { passive: true });

  // --- Cook mode ----------------------------------------------------------
  setupCookMode();

  // --- Initial factor from URL -------------------------------------------
  const initial = parseFloat(new URLSearchParams(location.search).get('servings') ?? '');
  if (!Number.isNaN(initial) && initial > 0) setServings(initial);
  else applyScale(1);
}

function setupCookMode(): void {
  const overlay = document.getElementById('cook-mode');
  const stepEl = overlay?.querySelector<HTMLElement>('[data-cook-step]');
  const progress = overlay?.querySelector<HTMLElement>('[data-cook-progress]');
  const prevBtn = overlay?.querySelector<HTMLButtonElement>('[data-cook-prev]');
  const nextBtn = overlay?.querySelector<HTMLButtonElement>('[data-cook-next]');
  const start = document.querySelector<HTMLButtonElement>('[data-cook-start]');
  const exit = overlay?.querySelector<HTMLButtonElement>('[data-cook-exit]');
  if (!overlay || !stepEl || !progress || !prevBtn || !nextBtn || !start) return;

  const stepBodies = Array.from(
    document.querySelectorAll<HTMLElement>('.method .step .body'),
  ).map((el) => el.innerHTML);
  if (stepBodies.length === 0) return;

  let index = 0;
  let wakeLock: WakeLockSentinel | null = null;

  function render(): void {
    stepEl!.innerHTML = stepBodies[index];
    progress!.textContent = `Step ${index + 1} of ${stepBodies.length}`;
    prevBtn!.disabled = index === 0;
    nextBtn!.textContent = index === stepBodies.length - 1 ? 'Done' : 'Next';
  }
  function next(): void {
    if (index < stepBodies.length - 1) {
      index++;
      render();
    } else {
      close();
    }
  }
  function prev(): void {
    if (index > 0) {
      index--;
      render();
    }
  }

  async function open(): Promise<void> {
    index = 0;
    render();
    overlay!.hidden = false;
    document.body.style.overflow = 'hidden';
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      /* wake lock unavailable — fine */
    }
    document.addEventListener('keydown', onKey);
  }
  function close(): void {
    overlay!.hidden = true;
    document.body.style.overflow = '';
    wakeLock?.release().catch(() => {});
    wakeLock = null;
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Escape') close();
  }

  start.addEventListener('click', open);
  exit?.addEventListener('click', close);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // Swipe navigation.
  let startX = 0;
  overlay.addEventListener(
    'touchstart',
    (e) => (startX = e.changedTouches[0].clientX),
    { passive: true },
  );
  overlay.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) next();
      else if (dx > 50) prev();
    },
    { passive: true },
  );
}
