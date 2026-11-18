import { store } from '../util/storage.js';
import { interpolate } from '../util/format.js';
import { fetchJSON } from '../util/net.js';

export const LANGUAGES = [
  { code: 'en', native: 'English', short: 'EN' },
  { code: 'ha', native: 'Hausa', short: 'HA' },
  { code: 'ig', native: 'Igbo', short: 'IG' },
  { code: 'yo', native: 'Yorùbá', short: 'YO' },
];
const KEY = 'cs-lang';
let lang = 'en';
let en = {}, dict = {}, overlay = {};
const listeners = new Set();
const cache = new Map();

async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const data = await fetchJSON(path);          // has a timeout, so a stalled request can never block start-up
  cache.set(path, data);
  return data;
}

export async function initI18n() {
  try { en = await loadJSON('data/i18n/en.json'); }
  catch (e) { console.error('English strings failed to load; interface text will show keys', e); window.__csNote && window.__csNote('i18n: ' + e.message); en = {}; }
  dict = en;
  const saved = store.get(KEY, 'en');
  await setLanguage(LANGUAGES.some((l) => l.code === saved) ? saved : 'en', { silent: true, persist: false });
}

export async function setLanguage(code, { silent = false, persist = true } = {}) {
  if (!LANGUAGES.some((l) => l.code === code)) code = 'en';
  if (code === 'en') { dict = en; overlay = {}; }
  else {
    try {
      [dict, overlay] = await Promise.all([loadJSON(`data/i18n/${code}.json`), loadJSON(`data/i18n/content.${code}.json`)]);
    } catch (e) {
      console.warn('Could not load language', code, e);
      dict = en; overlay = {}; code = 'en';
    }
  }
  lang = code;
  if (persist) store.set(KEY, code);
  document.documentElement.lang = code;
  if (!silent) listeners.forEach((fn) => fn(code));
  return code;
}

export const getLanguage = () => lang;
export const onLanguageChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** UI string lookup. Falls back to English, then to the key itself. */
export function t(key, vars) {
  const v = dict[key] ?? en[key];
  if (v == null) { console.warn('[i18n] missing key:', key); return key; }
  return vars ? interpolate(v, vars) : v;
}
export const hasKey = (key) => key in en;

/** Content overlays: kind = topics | articles | tips | questions | videos | chatbot. */
export function localize(kind, item) {
  const o = overlay[kind]?.[item.id];
  return o ? { ...item, ...o, _translated: true } : { ...item, _translated: lang === 'en' };
}
export const localizeAll = (kind, items) => items.map((i) => localize(kind, i));
export const isTranslated = (kind, id) => lang === 'en' || !!overlay[kind]?.[id];
export const translatedCount = (kind) => Object.keys(overlay[kind] || {}).length;
/** Plain-word language name in the current language. */
export const languageName = (code) => t(`lang.${code}`);

/** True when the current language has its own text for this field of this item. */
export const hasField = (kind, id, field) => lang === 'en' || overlay[kind]?.[id]?.[field] != null;
