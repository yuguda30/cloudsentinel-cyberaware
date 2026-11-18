import { h, icon } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { breadcrumb } from '../ui/layout.js';
import { href } from '../core/router.js';
import { getConfig } from '../core/data.js';
import { extLink, safeUrl } from '../util/dom.js';
export default async function about() {
  let cfg = {}; try { cfg = await getConfig(); } catch { /* the page works without it */ }
  const site = safeUrl(cfg.mainWebsiteUrl || '');
  const blocks = ['mission', 'vision', 'commitment', 'approach', 'initiatives'];
  const ic = { mission: 'flag', vision: 'eye', commitment: 'shield-check', approach: 'graduation-cap', initiatives: 'heart-handshake' };
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.about') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('about.title')), h('p', { class: 'lead' }, t('about.lead'))),
    h('div', { class: 'about-blocks' }, blocks.map((b) => h('section', { class: 'about-block', 'aria-labelledby': 'ab-' + b }, h('span', { class: 'topic-icon' }, icon(ic[b])), h('div', {}, h('h2', { id: 'ab-' + b, class: 'h3' }, t('about.' + b + 'Title')), h('p', {}, t('about.' + b)))))),
    h('section', { class: 'panel website-card spaced', 'aria-labelledby': 'ws-h' },
      h('img', { src: 'assets/img/logo.png', alt: '', width: 72, height: 72, class: 'website-logo' }),
      h('div', {}, h('h2', { id: 'ws-h', class: 'h3' }, t('about.websiteTitle')), h('p', {}, t('about.websiteText')),
        site ? h('a', { class: 'btn btn-primary', href: site, target: '_blank', rel: 'noopener noreferrer' }, icon('external-link'), t('about.websiteBtn')) : h('p', { class: 'muted' }, icon('info'), ' ', t('about.websiteSoon')))),
    h('div', { class: 'btn-row spaced' }, h('a', { class: 'btn btn-primary', href: href('/team') }, icon('users'), t('nav.team')), h('a', { class: 'btn btn-ghost', href: href('/contact') }, icon('mail'), t('nav.contact'))));
  return { title: t('nav.about'), description: t('about.lead'), el };
}
