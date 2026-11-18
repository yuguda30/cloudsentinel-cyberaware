import { safeUrl } from './dom.js';
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'sr-only';
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}
export function shareLinks(text, url) {
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    email: `mailto:?subject=${encodeURIComponent('CloudSentinel CyberAware')}&body=${t}%20${u}`,
  };
}
export async function nativeShare(title, text, url) {
  if (!navigator.share) return false;
  try { await navigator.share({ title, text, url: safeUrl(url) || undefined }); return true; }
  catch (e) { return e && e.name === 'AbortError' ? true : false; }
}
