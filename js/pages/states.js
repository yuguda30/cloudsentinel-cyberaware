import { h, icon } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { href } from '../core/router.js';

export function emptyState({ icon: ic = 'search', title, text, action }) {
  return h('div', { class: 'state', role: 'status' }, h('div', { class: 'state-icon' }, icon(ic)), h('h2', { class: 'state-title' }, title), text ? h('p', {}, text) : null, action || null);
}
export function errorState(onRetry) {
  return h('div', { class: 'state state-error', role: 'alert' }, h('div', { class: 'state-icon' }, icon('triangle-alert')),
    h('h2', { class: 'state-title' }, t('state.errorTitle')), h('p', {}, t('state.errorText')),
    h('div', { class: 'btn-row' }, onRetry ? h('button', { class: 'btn btn-primary', type: 'button', onClick: onRetry }, icon('refresh-cw'), t('ui.retry')) : null, h('a', { class: 'btn btn-ghost', href: href('/') }, t('nav.home'))));
}
export function errorPage() {
  return { title: t('state.errorTitle'), el: h('div', { class: 'container section' }, h('h1', { class: 'sr-only' }, t('state.errorTitle')), errorState(() => location.reload())) };
}
export function loadingBlock() { return h('div', { class: 'loading', role: 'status' }, h('span', { class: 'spinner' }), h('span', { class: 'sr-only' }, t('ui.loading'))); }
export function translationNotice(lang, name) {
  return h('p', { class: 'notice', role: 'note' }, icon('info'), h('span', {}, t('ui.notTranslated', { language: name })));
}
export default function notFound() {
  return { title: t('state.notFoundTitle'), el: h('div', { class: 'container section' }, h('div', { class: 'state' }, h('div', { class: 'state-icon' }, icon('flag')), h('h1', { class: 'state-title' }, t('state.notFoundTitle')), h('p', {}, t('state.notFoundText')), h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-primary', href: href('/') }, icon('house'), t('nav.home')), h('a', { class: 'btn btn-ghost', href: href('/learn') }, t('nav.learn'))))) };
}
