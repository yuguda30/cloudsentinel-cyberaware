// Network helpers: every request has a timeout so a stalled connection can never leave the page waiting forever.
export function withTimeout(promise, ms, label = 'operation') {
  let t;
  const timer = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

export async function fetchJSON(path, { timeout = 8000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), timeout);
    try {
      const res = await fetch(path, ctl ? { signal: ctl.signal } : undefined);
      if (!res.ok) { const e = new Error(`${path} returned HTTP ${res.status}`); e.status = res.status; throw e; }
      return await res.json();
    } catch (e) {
      lastErr = e && e.name === 'AbortError' ? new Error(`${path} timed out after ${timeout / 1000}s`) : e;
      if (lastErr.status === 404 || /timed out/.test(lastErr.message)) break;   // retrying will not help
      if (attempt < retries) await new Promise((r) => setTimeout(r, 400));
    } finally { clearTimeout(timer); }
  }
  throw lastErr;
}
