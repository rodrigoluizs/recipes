const CORNER_RADIUS = 28;
const FLATTEN_DISTANCE = 32;
const BAR_FADE_DISTANCE = 5;

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
  let startY = 0;
  let pulling = false;

  scroller.addEventListener(
    'touchstart',
    (e) => {
      if (scroller.scrollTop <= 0 && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        pulling = true;
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
  });
}
