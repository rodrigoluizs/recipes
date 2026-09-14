import { hardRefresh } from './hard-refresh';

const CORNER_RADIUS = 28;
const FLATTEN_DISTANCE = 32;
const BAR_FADE_DISTANCE = 5;
// Pull-to-refresh: how far past the top the user must drag to trigger a reload.
// Larger than the comfortable elastic-stretch range so a normal peek doesn't
// refresh. Only armed on touch devices (the recipe page has no other way to
// refresh in the installed PWA).
const REFRESH_THRESHOLD = 110;

const scroller = document.getElementById('hero-scroll');
const content = document.getElementById('hero-content');
const photo = document.getElementById('hero-photo');
const spacer = document.getElementById('hero-spacer');
const sheet = document.getElementById('hero-sheet');
const topbar = document.getElementById('hero-topbar');
const topbarTitle = topbar?.querySelector<HTMLElement>('.topbar-title');

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

// --- Scroll-driven corner flatten + top bar fade ---------------------------
if (scroller && spacer && sheet && topbar) {
  let ticking = false;

  function update(): void {
    ticking = false;
    const visibleHeight = spacer!.offsetHeight;
    const scrollTop = scroller!.scrollTop;

    const radius = CORNER_RADIUS * clamp01((visibleHeight - scrollTop) / FLATTEN_DISTANCE);
    sheet!.style.borderTopLeftRadius = `${radius}px`;
    sheet!.style.borderTopRightRadius = `${radius}px`;

    const barOpacity = clamp01((scrollTop - (visibleHeight - BAR_FADE_DISTANCE)) / BAR_FADE_DISTANCE);
    topbar!.style.opacity = String(barOpacity);
    if (topbarTitle) topbarTitle.style.opacity = String(clamp01((barOpacity - 0.7) / 0.3));
  }

  scroller.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );

  update();
}

// --- Touch-driven stretch on pull-down (rubber-band interception) ----------
// Listening on #hero-scroll itself (a real overflow container) rather than
// the document is what makes preventDefault() actually cancel the native
// bounce on iOS Safari — that reliably works on nested scrollers, not on
// the root document/body.
if (scroller && content && photo) {
  const ptr = document.getElementById('recipe-ptr');
  // Only offer pull-to-refresh where there's no browser chrome to do it: touch
  // devices (installed PWA / mobile Safari, whose recipe body doesn't scroll).
  const canRefresh = !!ptr && window.matchMedia('(pointer: coarse)').matches;
  let startY = 0;
  let pulling = false;
  let armed = false;

  function setIndicator(delta: number): void {
    if (!ptr) return;
    const progress = Math.min(delta / REFRESH_THRESHOLD, 1);
    // Travels from off-screen (-56) down to a resting spot as you pull.
    ptr.style.transform = `translateY(${-56 + progress * 72}px) rotate(${progress * 270}deg)`;
    ptr.style.opacity = String(progress);
  }

  function resetIndicator(): void {
    if (!ptr) return;
    ptr.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    ptr.style.transform = 'translateY(-56px)';
    ptr.style.opacity = '0';
    setTimeout(() => (ptr.style.transition = ''), 200);
  }

  scroller.addEventListener(
    'touchstart',
    (e) => {
      if (scroller.scrollTop <= 0 && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        pulling = true;
        armed = false;
      }
    },
    { passive: true },
  );

  scroller.addEventListener(
    'touchmove',
    (e) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        pulling = false;
        if (canRefresh) resetIndicator();
        return;
      }
      e.preventDefault();
      const height = photo!.offsetHeight;
      photo!.style.transform = `scale(${(height + delta) / height})`;
      // The rest of the content is dragged down by the same amount so it
      // stays glued to the photo's growing bottom edge — matching the
      // native behavior where the whole scrollview content pans down
      // together with the zooming cover photo, not just the photo alone.
      content!.style.transform = `translateY(${delta}px)`;
      if (canRefresh) {
        setIndicator(delta);
        armed = delta >= REFRESH_THRESHOLD;
      }
    },
    { passive: false },
  );

  scroller.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    photo!.style.transition = 'transform 0.2s ease';
    photo!.style.transform = 'scale(1)';
    content!.style.transition = 'transform 0.2s ease';
    content!.style.transform = 'translateY(0)';
    setTimeout(() => {
      photo!.style.transition = '';
      content!.style.transition = '';
    }, 200);

    if (canRefresh && armed) {
      armed = false;
      ptr!.classList.add('refreshing');
      setTimeout(() => hardRefresh(), 150);
    } else if (canRefresh) {
      resetIndicator();
    }
  });
}
