export function formatDate(iso, precision, lang) {
  if (!iso) return '';
  if (precision === 'year') return String(iso).slice(0, 4);
  try { return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
}
export function interpolate(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));
}
export function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
export function isYouTubeId(id) { return /^[A-Za-z0-9_-]{11}$/.test(id || ''); }
