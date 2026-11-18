import { h, icon, $, clear, announce } from '../util/dom.js';
import { t, getLanguage, setLanguage, LANGUAGES } from '../core/i18n.js';
import { getThemeMode, setThemeMode, getResolvedTheme, onThemeChange } from '../core/theme.js';
import { href } from '../core/router.js';
import { getConfig } from '../core/data.js';
import { extLink, safeUrl } from '../util/dom.js';

export const NAV = [
  { id: 'home', path: '/', icon: 'house', key: 'nav.home' },
  { id: 'learn', path: '/learn', icon: 'graduation-cap', key: 'nav.learn' },
  { id: 'videos', path: '/videos', icon: 'circle-play', key: 'nav.videos' },
  { id: 'quiz', path: '/quiz', icon: 'clipboard-check', key: 'nav.quiz' },
  { id: 'tips', path: '/tips', icon: 'lightbulb', key: 'nav.tips', desktopOnly: true },
  { id: 'articles', path: '/articles', icon: 'newspaper', key: 'nav.articles', desktopOnly: true },
  { id: 'chat', path: '/chat', icon: 'bot', key: 'nav.chat', desktopOnly: true },
  { id: 'about', path: '/about', icon: 'building-2', key: 'nav.about', desktopOnly: true },
];
export const MORE_ROUTES = ['more', 'articles', 'tips', 'chat', 'about', 'team', 'contact', 'privacy', 'terms', 'search', 'saved'];
export const sectionOf = (path) => path.split('/')[1] || 'home';

/* ---------- popover menu (used for language and appearance) ---------- */
function menuButton({ id, label, buttonContent, items, onPick, current }) {
  const btn = h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': id, 'aria-label': label }, buttonContent);
  const list = h('ul', { class: 'menu', id, role: 'menu', hidden: true });
  const wrap = h('div', { class: 'menu-wrap' }, btn, list);
  const close = (focus = true) => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', outside, true); document.removeEventListener('keydown', onKey, true); if (focus) btn.focus(); };
  const outside = (e) => { if (!wrap.contains(e.target)) close(false); };
  const onKey = (e) => {
    const els = [...list.querySelectorAll('[role=menuitemradio]')];
    const i = els.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length].focus(); }
    else if (e.key === 'Tab') close(false);
  };
  const fill = () => {
    clear(list);
    for (const it of items()) {
      const on = it.value === current();
      list.append(h('li', { role: 'none' }, h('button', { type: 'button', role: 'menuitemradio', 'aria-checked': String(on), class: 'menu-item' + (on ? ' is-on' : ''), lang: it.lang, onClick: async () => { close(); await onPick(it.value); } },
        it.icon ? icon(it.icon) : null, h('span', {}, it.label), on ? icon('check', 'menu-check') : null)));
    }
  };
  btn.addEventListener('click', () => {
    if (!list.hidden) return close();
    fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', outside, true); document.addEventListener('keydown', onKey, true);
    (list.querySelector('[aria-checked=true]') || list.querySelector('button')).focus();
  });
  return wrap;
}

export function languageMenu() {
  return menuButton({
    id: 'lang-menu-' + Math.random().toString(36).slice(2, 6), label: `${LANGUAGES.find((l) => l.code === getLanguage()).short}: ${t('ui.language')}`,
    buttonContent: [icon('languages'), h('span', { class: 'menu-btn-text' }, LANGUAGES.find((l) => l.code === getLanguage()).short)],
    items: () => LANGUAGES.map((l) => ({ value: l.code, label: l.native, lang: l.code })),
    current: getLanguage,
    onPick: async (code) => { await setLanguage(code); announce(t('ui.languageChanged', { language: LANGUAGES.find((l) => l.code === code).native })); },
  });
}
export function themeMenu() {
  const names = { light: 'theme.light', dark: 'theme.dark', system: 'theme.system' };
  const ic = { light: 'sun', dark: 'moon', system: 'monitor' };
  const content = () => icon(ic[getThemeMode()] === 'monitor' ? (getResolvedTheme() === 'dark' ? 'moon' : 'sun') : ic[getThemeMode()]);
  const m = menuButton({
    id: 'theme-menu-' + Math.random().toString(36).slice(2, 6), label: t('theme.label'),
    buttonContent: [content()],
    items: () => ['light', 'dark', 'system'].map((v) => ({ value: v, label: t(names[v]), icon: ic[v] })),
    current: getThemeMode, onPick: (v) => setThemeMode(v),
  });
  const btn = m.querySelector('button');
  onThemeChange(() => { if (!btn.isConnected) return; clear(btn); btn.append(content()); });
  return m;
}

/** Segmented control for the More page (large touch targets, no popover). */
export function segmented({ label, options, current, onPick }) {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': label });
  const draw = () => {
    clear(wrap);
    for (const o of options()) wrap.append(h('button', { type: 'button', class: 'seg' + (o.value === current() ? ' is-on' : ''), 'aria-pressed': String(o.value === current()), lang: o.lang, onClick: async () => { await onPick(o.value); draw(); } }, o.icon ? icon(o.icon) : null, h('span', {}, o.label)));
  };
  draw(); return wrap;
}

/* ---------- header ---------- */
export function renderHeader(root) {
  clear(root);
  root.append(h('div', { class: 'container header-inner' },
    h('a', { class: 'brand', href: href('/') },
      h('img', { src: 'assets/img/logo.png', alt: '', width: 44, height: 44, class: 'brand-mark' }),
      h('span', { class: 'brand-text' }, h('span', { class: 'brand-top' }, 'CloudSentinel'), h('span', { class: 'brand-bottom' }, 'CyberAware'))),
    h('nav', { class: 'nav-desktop', 'aria-label': t('ui.mainNav') },
      NAV.map((n) => h('a', { href: href(n.path), dataset: { nav: n.id } }, t(n.key)))),
    h('div', { class: 'header-actions' },
      h('a', { class: 'icon-btn', href: href('/search'), 'aria-label': t('nav.search') }, icon('search')),
      languageMenu(), themeMenu())));
}

/* ---------- bottom tab bar (mobile) ---------- */
export function renderTabbar(root) {
  clear(root);
  const items = [...NAV.filter((n) => !n.desktopOnly), { id: 'more', path: '/more', icon: 'ellipsis', key: 'nav.more' }];
  root.append(h('ul', { class: 'tabbar-list' }, items.map((n) => h('li', {}, h('a', { class: 'tab', href: href(n.path), dataset: { nav: n.id } }, icon(n.icon), h('span', {}, t(n.key)))))));
  root.setAttribute('aria-label', t('ui.mainNav'));
}

export function setActiveNav(path) {
  const sec = sectionOf(path);
  const isMore = MORE_ROUTES.includes(sec);
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const id = a.dataset.nav, inTab = a.classList.contains('tab');
    const active = inTab ? (id === 'more' ? isMore : id === sec || (id === 'home' && sec === 'home')) : id === sec || (id === 'about' && ['about', 'team', 'contact'].includes(sec));
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ---------- footer ---------- */
export async function renderFooter(root) {
  clear(root);
  let cfg = {}; try { cfg = await getConfig(); } catch { /* footer still renders */ }
  const socials = Object.entries(cfg.social || {}).filter(([, v]) => v);
  const mainSite = safeUrl(cfg.mainWebsiteUrl || '');
  const col = (titleKey, links) => h('div', { class: 'footer-col' }, h('h2', { class: 'footer-title' }, t(titleKey)), h('ul', {}, links.map(([k, p]) => h('li', {}, h('a', { href: href(p) }, t(k))))));
  root.append(h('div', { class: 'container' },
    h('div', { class: 'footer-grid' },
      h('div', { class: 'footer-brand' },
        h('a', { class: 'brand brand-footer', href: href('/') }, h('img', { src: 'assets/img/logo.png', alt: '', width: 52, height: 52, class: 'brand-mark' }), h('span', { class: 'brand-text' }, h('span', { class: 'brand-top' }, 'CloudSentinel'), h('span', { class: 'brand-bottom' }, 'CyberAware'))),
        h('p', { class: 'footer-tagline' }, t('brand.tagline')),
        h('p', { class: 'footer-desc' }, t('footer.desc')),
        mainSite ? h('p', { class: 'footer-site' }, extLink(mainSite, icon('external-link'), t('about.websiteBtn'))) : null,
        socials.length ? h('ul', { class: 'social-list' }, socials.map(([k, v]) => h('li', {}, extLink(v, t('social.' + k))))) : null),
      col('footer.learn', [['nav.learn', '/learn'], ['nav.videos', '/videos'], ['nav.quiz', '/quiz'], ['nav.tips', '/tips'], ['nav.articles', '/articles']]),
      col('footer.platform', [['nav.chat', '/chat'], ['nav.about', '/about'], ['nav.team', '/team'], ['nav.contact', '/contact'], ['nav.search', '/search']]),
      col('footer.legal', [['nav.privacy', '/privacy'], ['nav.terms', '/terms']])),
    h('div', { class: 'footer-bottom' },
      h('p', {}, t('footer.copyright', { year: new Date().getFullYear() })),
      h('p', { class: 'footer-note' }, t('footer.note')))));
}

/* ---------- back to top ---------- */
export function mountBackToTop(root) {
  const btn = h('button', { class: 'to-top', type: 'button', hidden: true, 'aria-label': t('ui.backToTop'), onClick: () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }, icon('arrow-up'));
  root.append(btn);
  const upd = () => { btn.hidden = window.scrollY < 700; };
  addEventListener('scroll', upd, { passive: true }); upd();
  return { relabel: () => btn.setAttribute('aria-label', t('ui.backToTop')) };
}

/* ---------- toast ---------- */
export function toast(message, { action, onAction, duration = 4000 } = {}) {
  const host = $('#toasts');
  const el = h('div', { class: 'toast', role: 'status' }, h('span', {}, message), action ? h('button', { class: 'btn btn-sm btn-light', type: 'button', onClick: () => { onAction?.(); el.remove(); } }, action) : null);
  host.append(el);
  if (duration) setTimeout(() => el.remove(), duration);
  return el;
}

export function breadcrumb(items) {
  return h('nav', { class: 'breadcrumb', 'aria-label': t('ui.breadcrumb') }, h('ol', {}, items.map((it, i) => h('li', {}, it.href ? h('a', { href: it.href }, it.label) : h('span', { 'aria-current': 'page' }, it.label)))));
}
