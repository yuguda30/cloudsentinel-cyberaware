import { $, clear, h, prefersReducedMotion, jumpTo } from '../util/dom.js';
import { withTimeout } from '../util/net.js';

const routes = [];
let current = null;
let rendered = false;
const listeners = new Set();

export function route(pattern, loader) {
  const keys = [];
  const re = pattern === '*' ? /^.*$/ : new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ pattern, re, keys, loader });
}
export const onRoute = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function parseHash(hash = location.hash) {
  let raw = hash.replace(/^#/, '') || '/';
  if (!raw.startsWith('/')) raw = '/' + raw;
  const [path, qs = ''] = raw.split('?');
  return { path: decodeURIComponent(path), query: Object.fromEntries(new URLSearchParams(qs)) };
}
export const href = (path) => '#' + path;
export function navigate(path) { location.hash = path; }

function match(path) {
  for (const r of routes) {
    const m = r.re.exec(path);
    if (m) return { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

let seq = 0;
const TIMEOUT = { load: 15000, page: 20000 };

/** Last-resort error screen built without any other module, so it works even if states.js failed to load. */
function plainErrorPage(e) {
  const el = h('div', { class: 'container section' }, h('div', { class: 'state state-error', role: 'alert' },
    h('h1', { class: 'state-title' }, 'This page could not load'),
    h('p', {}, 'Check your connection and try again. If it keeps happening, use “Reload Website”.'),
    h('p', { class: 'muted' }, 'Reference: ' + String((e && e.message) || e).slice(0, 160)),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => render({ keepScroll: true }) }, 'Retry'),
      h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => (window.__csHardReset ? window.__csHardReset() : location.reload()) }, 'Reload Website'))));
  return { title: 'Error', el };
}

export async function render({ keepScroll = false } = {}) {
  const mySeq = ++seq;
  const { path, query } = parseHash();
  const app = $('#app');
  const m = match(path) || { r: routes.find((x) => x.pattern === '*'), params: {} };
  if (current?.cleanup) { try { current.cleanup(); } catch (e) { console.warn(e); } }
  current = null;
  const slow = setTimeout(() => { if (mySeq === seq && !app.children.length) { clear(app); app.append(h('div', { class: 'loading', role: 'status' }, h('span', { class: 'spinner' }), h('span', { class: 'sr-only' }, '…'))); } }, 180);
  let page;
  try {
    const mod = await withTimeout(m.r.loader(), TIMEOUT.load, 'Loading the page code');
    page = await withTimeout(Promise.resolve(mod.default({ params: m.params, query, path })), TIMEOUT.page, 'Preparing the page');
    if (!page || !page.el) throw new Error('Page returned no content');
  } catch (e) {
    console.error('Route error', e);
    window.__csNote && window.__csNote('route ' + path + ': ' + (e && e.message));
    try { const { errorPage } = await withTimeout(import('../pages/states.js'), 8000, 'Loading the error page'); page = errorPage(e); }
    catch (e2) { page = plainErrorPage(e); }
  } finally { clearTimeout(slow); }
  if (mySeq !== seq) return;           // a newer navigation superseded this one
  const swap = () => {
    clear(app);
    app.append(page.el);                // from here on the content is on screen; nothing below may undo that
    current = page; rendered = true;
    const safe = (label, fn) => { try { fn(); } catch (e) { console.warn('[router] ' + label, e); } };
    safe('title', () => {
      document.title = page.title ? `${page.title} · CloudSentinel CyberAware` : 'CloudSentinel CyberAware';
      const desc = $('meta[name="description"]');
      if (desc && page.description) desc.setAttribute('content', page.description);
    });
    safe('scroll', () => { if (!keepScroll) jumpTo(0); });
    safe('focus', () => { const heading = $('h1', app); if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); } });
    safe('mounted', () => page.mounted?.());
    for (const fn of [...listeners]) safe('listener', () => fn({ path, query }));
  };
  if (document.startViewTransition && !prefersReducedMotion() && rendered) {
    try { const vt = document.startViewTransition(swap); vt.ready.catch(() => {}); vt.finished.catch(() => {}); vt.updateCallbackDone.catch(() => {}); }
    catch { if (!app.contains(page.el)) swap(); }
  } else { swap(); safe_pageIn(app); }
}
function safe_pageIn(app) { try { app.classList.remove('page-in'); void app.offsetWidth; if (!prefersReducedMotion()) app.classList.add('page-in'); } catch { /* cosmetic only */ } }
export function startRouter() {
  addEventListener('hashchange', () => render());
  return render();
}
export const refresh = () => render({ keepScroll: true });
