import { store } from '../util/storage.js';
const KEY = 'cs-theme';
const mq = window.matchMedia('(prefers-color-scheme: dark)');
let mode = store.get(KEY, 'system');
const listeners = new Set();

function resolved() { return mode === 'dark' || (mode === 'system' && mq.matches) ? 'dark' : 'light'; }

export function applyTheme() {
  const r = document.documentElement;
  r.dataset.theme = resolved();
  r.dataset.themeMode = mode;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])') || document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved() === 'dark' ? '#051A33' : '#08305C');
  listeners.forEach((fn) => fn(mode, resolved()));
}
export const getThemeMode = () => mode;
export const getResolvedTheme = resolved;
export function setThemeMode(m) {
  if (!['light', 'dark', 'system'].includes(m)) return;
  mode = m; store.set(KEY, m); applyTheme();
}
export const onThemeChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
mq.addEventListener?.('change', () => { if (mode === 'system') applyTheme(); });
