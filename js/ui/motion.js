import { prefersReducedMotion } from '../util/dom.js';
let io;
function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  return io;
}
function countUp(el) {
  const end = Number(el.dataset.count), dur = 900, t0 = performance.now();
  const tick = (now) => { const p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
/** Light, opt-in scroll effects. With reduced motion (or no IntersectionObserver) content shows immediately. */
export function observeReveals(root = document) {
  const els = [...root.querySelectorAll('[data-reveal], [data-count]')];
  let instant = prefersReducedMotion() || !('IntersectionObserver' in window);
  const show = (el) => { el.classList.add('is-in'); if (el.dataset.count) el.textContent = el.dataset.count; };
  if (!instant) { try { observer(); } catch (e) { console.warn('Scroll effects unavailable', e); instant = true; } }   // never hide content because an effect failed
  for (const el of els) { if (instant) show(el); else observer().observe(el); }
}
