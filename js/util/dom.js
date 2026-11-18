// Tiny DOM helpers. All rendering goes through h()/text nodes, never innerHTML,
// so content from JSON can never inject markup or script.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (p.startsWith('--')) el.style.setProperty(p, val); else el.style[p] = val;
      }
    } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}

export function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

const SVG_NS = 'http://www.w3.org/2000/svg';
export function icon(name, cls = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', ('icon ' + cls).trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `assets/icons/sprite.svg#i-${name}`);
  svg.append(use);
  return svg;
}

/** Only http(s) and mailto URLs are ever put into href attributes. */
export function safeUrl(url) {
  if (url == null || !String(url).trim()) return null;   // an empty value must not resolve to the current page
  try {
    const u = new URL(url, location.href);
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}

export function extLink(url, ...kids) {
  const href = safeUrl(url);
  if (!href) return h('span', {}, ...kids);
  const external = !href.startsWith(location.origin) && !href.startsWith('mailto:');
  return h('a', { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, ...kids);
}

export function debounce(fn, ms = 200) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Polite screen-reader announcement. */
export function announce(msg) {
  const r = document.getElementById('sr-live');
  if (!r) return;
  r.textContent = '';
  setTimeout(() => { r.textContent = msg; }, 30);
}

/** Normalise text for searching: lower-case, strip tone marks and dots, collapse space. */
export function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ɓ]/g, 'b').replace(/[ɗ]/g, 'd').replace(/[ƙ]/g, 'k').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\bwi fi\b/g, 'wifi').replace(/\s+/g, ' ').trim();
}

/** Like el.replaceChildren(...) but ignores null/undefined/false (the native method would print "null"). */
export function setKids(el, ...kids) { clear(el); return append(el, kids); }

/** Jump (no animation) to a vertical position. Works on browsers that reject scrollTo({behavior:'instant'}). */
export function jumpTo(top = 0) {
  const r = document.documentElement, prev = r.style.scrollBehavior;
  r.style.scrollBehavior = 'auto';
  try { window.scrollTo(0, top); } catch { try { r.scrollTop = top; } catch { /* nothing else to try */ } }
  r.style.scrollBehavior = prev;
}
