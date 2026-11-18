// localStorage wrapper that never throws (private mode, blocked storage) and falls back to memory.
const mem = new Map();
let ok = true;
try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch { ok = false; }
export const store = {
  get(key, fallback = null) {
    try {
      const raw = ok ? localStorage.getItem(key) : mem.get(key) ?? null;
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    try { if (ok) localStorage.setItem(key, raw); else mem.set(key, raw); } catch { mem.set(key, raw); }
  },
  remove(key) { try { if (ok) localStorage.removeItem(key); else mem.delete(key); } catch { /* ignore */ } },
};
