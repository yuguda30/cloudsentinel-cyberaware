import { setKids } from '../util/dom.js';
import { h, icon } from '../util/dom.js';
import { t, getLanguage, setLanguage, LANGUAGES } from '../core/i18n.js';
import { getThemeMode, setThemeMode } from '../core/theme.js';
import { segmented } from '../ui/layout.js';
import { href } from '../core/router.js';
import { canInstall, promptInstall, onInstallChange, isStandalone, isIOS } from '../core/pwa.js';
import { newsletterForm } from '../ui/newsletter.js';

export default async function more() {
  const links = [['articles', '/articles', 'newspaper'], ['tips', '/tips', 'lightbulb'], ['chat', '/chat', 'bot'], ['about', '/about', 'building-2'], ['team', '/team', 'users'], ['contact', '/contact', 'mail'], ['saved', '/saved', 'bookmark'], ['search', '/search', 'search']];
  const installHost = h('div', {});
  const drawInstall = () => {
    setKids(installHost, );
    if (isStandalone()) return;
    if (canInstall()) installHost.append(h('section', { class: 'panel install' }, h('h2', { class: 'h4' }, icon('download'), t('pwa.installTitle')), h('p', {}, t('pwa.installText')), h('button', { class: 'btn btn-primary', type: 'button', onClick: promptInstall }, t('pwa.installBtn'))));
    else if (isIOS()) installHost.append(h('section', { class: 'panel install' }, h('h2', { class: 'h4' }, icon('download'), t('pwa.installTitle')), h('p', {}, t('pwa.iosHint'))));
  };
  drawInstall(); const off = onInstallChange(drawInstall);
  const el = h('div', { class: 'container section page-head-wrap more-page' },
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('nav.more'))),
    h('ul', { class: 'more-list' }, links.map(([id, p, ic]) => h('li', {}, h('a', { class: 'more-item', href: href(p) }, h('span', { class: 'topic-icon' }, icon(ic)), h('span', {}, t('nav.' + id)), icon('chevron-right', 'card-arrow'))))),
    h('section', { class: 'panel settings', 'aria-labelledby': 'set-h' }, h('h2', { id: 'set-h', class: 'h4' }, t('more.settings')),
      h('div', { class: 'field' }, h('span', { class: 'label' }, t('ui.language')), segmented({ label: t('ui.language'), options: () => LANGUAGES.map((l) => ({ value: l.code, label: l.native, lang: l.code })), current: getLanguage, onPick: (c) => setLanguage(c) })),
      h('div', { class: 'field' }, h('span', { class: 'label' }, t('theme.label')), segmented({ label: t('theme.label'), options: () => [{ value: 'light', label: t('theme.light'), icon: 'sun' }, { value: 'dark', label: t('theme.dark'), icon: 'moon' }, { value: 'system', label: t('theme.system'), icon: 'monitor' }], current: getThemeMode, onPick: (v) => setThemeMode(v) }))),
    installHost, h('div', { class: 'spaced' }, await newsletterForm()),
    h('p', { class: 'more-legal' }, h('a', { href: href('/privacy') }, t('nav.privacy')), ' · ', h('a', { href: href('/terms') }, t('nav.terms'))));
  return { title: t('nav.more'), el, cleanup: off };
}
