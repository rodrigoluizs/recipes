import { scaleAmount, formatQuantity, roundNice } from '../lib/quantity';

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

type Mode = 'amount' | 'serving' | 'ingredient';

const MIN_FACTOR = 0.25;
const MAX_FACTOR = 8;

const dataEl = document.getElementById('recipe-data');
if (dataEl?.textContent) {
  init(JSON.parse(dataEl.textContent) as RecipeClientData);
}

function clamp(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, n));
}

function init(data: RecipeClientData): void {
  const { baseServings } = data;
  let factor = 1;
  let mode: Mode = 'amount';
  let selectedName: string | null = null;

  const qtyEls = Array.from(document.querySelectorAll<HTMLElement>('[data-qty]'));
  const servingsEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-servings]'),
  );

  const slider = document.getElementById('scale-slider') as HTMLInputElement | null;
  const valueBox = document.getElementById('scale-value-box');
  const valueInput = document.getElementById('scale-value') as HTMLInputElement | null;
  const prefix = document.getElementById('scale-prefix');
  const suffix = document.getElementById('scale-suffix');
  const selectBtn = document.getElementById('scale-select');
  const selectLabel = document.getElementById('scale-select-label');
  const hint = document.getElementById('scale-hint');
  const modeButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-scale-mode]'),
  );
  const ingredientsList = document.querySelector<HTMLElement>('.ingredients');
  const ingredientRows = Array.from(
    document.querySelectorAll<HTMLElement>('.ingredients .row[data-scalable]'),
  );

  function updateSliderFill(): void {
    if (!slider) return;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const pct = ((parseFloat(slider.value) - min) / (max - min)) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
  }

  /** The number shown in the editable value box for the current mode. */
  function currentValue(): number {
    if (mode === 'serving') return Math.max(1, Math.round(baseServings * factor));
    if (mode === 'ingredient' && selectedName) {
      const ing = data.ingredients[selectedName];
      return ing?.amount !== undefined ? scaleAmount(ing.amount, factor) : 0;
    }
    return roundNice(factor);
  }

  function updateDisplay(): void {
    // Don't clobber the field while the user is typing in it.
    if (valueInput && document.activeElement !== valueInput) {
      valueInput.value = String(currentValue());
    }
    if (prefix) prefix.textContent = mode === 'amount' ? '×' : '';
    if (suffix) {
      suffix.textContent =
        mode === 'serving'
          ? 'servings'
          : mode === 'ingredient' && selectedName
            ? (data.ingredients[selectedName]?.unit ?? '')
            : '';
    }
    if (selectLabel) {
      selectLabel.textContent = selectedName
        ? (data.ingredients[selectedName]?.name ?? 'Select')
        : 'Select';
    }
  }

  /** Recompute every displayed quantity from the current factor. */
  function applyScale(next: number): void {
    factor = clamp(next);

    for (const el of qtyEls) {
      const base = parseFloat(el.dataset.amount ?? '');
      if (Number.isNaN(base)) continue;
      const unit = el.dataset.unit || undefined;
      el.textContent = formatQuantity({ amount: scaleAmount(base, factor), unit });
    }

    const scaledServings = Math.max(1, Math.round(baseServings * factor));
    for (const el of servingsEls) el.textContent = String(scaledServings);

    if (slider) {
      slider.value = String(factor);
      updateSliderFill();
    }
    updateDisplay();

    const url = new URL(location.href);
    if (Math.abs(factor - 1) < 1e-9) url.searchParams.delete('servings');
    else url.searchParams.set('servings', String(scaledServings));
    history.replaceState(null, '', url);
  }

  // --- Panel toggle -------------------------------------------------------
  document
    .querySelector<HTMLButtonElement>('[data-scale-toggle]')
    ?.addEventListener('click', () => {
      const panel = document.getElementById('scale-panel');
      if (panel) panel.hidden = !panel.hidden;
    });

  // --- Mode switch --------------------------------------------------------
  function setMode(next: Mode): void {
    mode = next;
    for (const b of modeButtons) {
      b.classList.toggle('is-active', b.dataset.scaleMode === next);
    }
    const picking = next === 'ingredient';
    if (selectBtn) selectBtn.hidden = !picking;
    // In ingredient mode the value box only appears once a basis is chosen.
    if (valueBox) valueBox.hidden = picking && selectedName === null;
    if (hint) hint.hidden = !picking || selectedName !== null;
    ingredientsList?.classList.toggle('picking', picking);
    updateDisplay();
  }
  for (const b of modeButtons) {
    b.addEventListener('click', () => setMode(b.dataset.scaleMode as Mode));
  }

  // --- Slider (drives the factor in every mode) ---------------------------
  slider?.addEventListener('input', () => applyScale(parseFloat(slider.value)));

  // --- Typed value (alternative to the slider) ----------------------------
  valueInput?.addEventListener('input', () => {
    const v = parseFloat(valueInput.value);
    if (Number.isNaN(v) || v <= 0) return;
    if (mode === 'serving') {
      applyScale(v / baseServings);
    } else if (mode === 'ingredient' && selectedName) {
      const base = data.ingredients[selectedName]?.amount;
      if (base) applyScale(v / base);
    } else {
      applyScale(v);
    }
  });

  // --- Ingredient selection (basis to read while scaling) -----------------
  ingredientsList?.addEventListener(
    'click',
    (e) => {
      if (mode !== 'ingredient') return; // let the checkbox toggle normally
      const row = (e.target as HTMLElement).closest<HTMLElement>(
        '.row[data-scalable]',
      );
      if (!row) return;
      e.preventDefault();
      selectedName = row.dataset.ing ?? null;
      for (const r of ingredientRows) r.classList.toggle('selected', r === row);
      if (hint) hint.hidden = true;
      if (valueBox) valueBox.hidden = false;
      selectBtn?.classList.add('has-selection');
      updateDisplay();
    },
    true,
  );
  selectBtn?.addEventListener('click', () => {
    if (hint) hint.hidden = selectedName !== null;
  });

  // --- Reset --------------------------------------------------------------
  document
    .querySelector('[data-scale-reset]')
    ?.addEventListener('click', () => applyScale(1));

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
  setupCookMode(hidePopover);

  // --- Initial state ------------------------------------------------------
  setMode('amount');
  const initial = parseFloat(
    new URLSearchParams(location.search).get('servings') ?? '',
  );
  applyScale(!Number.isNaN(initial) && initial > 0 ? initial / baseServings : 1);
}

function setupCookMode(hidePopover: () => void): void {
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
    hidePopover(); // clear any ingredient tooltip from the previous step
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
      wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
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
