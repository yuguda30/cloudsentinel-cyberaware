import { $, h } from './util/dom.js';
import { initI18n, onLanguageChange, t } from './core/i18n.js';
import { applyTheme } from './core/theme.js';
import { route, startRouter, onRoute, refresh, parseHash } from './core/router.js';
import { renderHeader, renderTabbar, renderFooter, setActiveNav, mountBackToTop } from './ui/layout.js';
import { registerSW, watchConnection } from './core/pwa.js';
import { observeReveals } from './ui/motion.js';
import { withTimeout } from './util/net.js';

const page = (file) => () => import(`./pages/${file}.js`);
route('/', page('home'));
route('/learn', page('learn'));
route('/learn/:id', page('topic'));
route('/videos', page('videos'));
route('/quiz', page('quiz'));
route('/quiz/:topic', page('quiz'));
route('/tips', page('tips'));
route('/articles', page('articles'));
route('/articles/:id', page('article'));
route('/saved', page('saved'));
route('/chat', page('chat'));
route('/about', page('about'));
route('/team', page('team'));
route('/contact', page('contact'));
route('/privacy', page('legal'));
route('/terms', page('legal'));
route('/more', page('more'));
route('/search', page('search'));
route('*', page('states'));

/** Run one start-up step. A failing optional step is logged and skipped; it never stops the site from loading. */
function step(label, fn) {
  try { const r = fn(); if (r && typeof r.catch === 'function') r.catch((e) => report(label, e)); return r; }
  catch (e) { report(label, e); return null; }
}
function report(label, e) {
  console.error(`[startup] ${label} failed`, e);
  if (window.__csNote) window.__csNote(`${label}: ${(e && e.message) || e}`);
}

function drawChrome() {
  step('header', () => renderHeader($('#site-header')));
  step('tab bar', () => renderTabbar($('#tabbar')));
  step('footer', () => renderFooter($('#site-footer')));
  step('skip link', () => { $('.skip-link').textContent = t('ui.skip'); });
  step('active nav', () => setActiveNav(parseHash().path));
}

// Tapping the link for the page you are already on (e.g. the Quiz tab during a quiz) re-opens it fresh.
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) step('refresh', () => refresh());
});

async function start() {
  step('theme', applyTheme);
  try { await withTimeout(initI18n(), 10000, 'Loading the interface text'); } catch (e) { report('language', e); }   // falls back to English keys
  drawChrome();
  let toTop = null;
  step('back-to-top', () => { toTop = mountBackToTop(document.body); });
  step('connection', watchConnection);
  onRoute(({ path }) => { step('nav highlight', () => setActiveNav(path)); step('scroll effects', () => observeReveals($('#app'))); });
  onLanguageChange(() => { drawChrome(); step('back-to-top label', () => toTop && toTop.relabel()); step('connection', watchConnection); step('re-render', () => refresh()); });
  await startRouter();
  if (!$('#app').children.length) throw new Error('The page rendered no content');
}

start().then(
  () => finish(),
  (e) => {
    report('start-up', e);
    // If something is on screen, keep it. Otherwise show the explicit error screen instead of a blank page.
    if ($('#app') && $('#app').children.length) finish(); else window.__csFail ? window.__csFail(e) : showPlainFailure(e);
  },
);

function finish() {
  if (window.__csDone) window.__csDone(); else { const b = $('#boot'); if (b) b.remove(); }
  step('service worker', () => registerSW());          // optional: the site works without it
}
function showPlainFailure(e) {
  const b = $('#boot'); if (b) b.remove();
  $('#app').append(h('div', { class: 'container section' }, h('h1', {}, 'The page could not load'), h('p', {}, String((e && e.message) || e)), h('button', { class: 'btn btn-primary', type: 'button', onClick: () => location.reload() }, 'Retry')));
}
