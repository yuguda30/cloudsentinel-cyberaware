import { toast } from '../ui/layout.js';
import { t } from './i18n.js';
let deferred = null;
const subs = new Set();
export const onInstallChange = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const canInstall = () => !!deferred;
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null; subs.forEach((f) => f());
  return outcome;
}
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; subs.forEach((f) => f()); });
addEventListener('appinstalled', () => { deferred = null; subs.forEach((f) => f()); });

let wantsReload = false, reloading = false;
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' });
    if (!reg) return;
    const offer = (worker) => toast(t('pwa.updateReady'), { action: t('pwa.refresh'), duration: 0, onAction: () => { wantsReload = true; worker.postMessage({ type: 'SKIP_WAITING' }); } });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    const track = (nw) => nw && nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) offer(nw); });
    if (reg.installing) track(reg.installing);          // an update may already be installing when the page loads
    reg.addEventListener('updatefound', () => track(reg.installing));
    // Reload only when the visitor pressed Refresh. A first install must never reload the page unexpectedly.
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!wantsReload || reloading) return; reloading = true; location.reload(); });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  } catch (e) { console.warn('Service worker registration failed', e); }
}
export function watchConnection() {
  const bar = document.getElementById('offline-bar');
  const upd = () => { bar.hidden = navigator.onLine; bar.textContent = navigator.onLine ? '' : t('pwa.offline'); };
  addEventListener('online', upd); addEventListener('offline', upd); upd();
  return upd;
}
