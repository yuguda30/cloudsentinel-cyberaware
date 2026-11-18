import { h } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { getTeam } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { teamCard } from '../ui/cards.js';
import { href, refresh } from '../core/router.js';
import { errorState } from './states.js';

export default async function team() {
  let d; try { d = await getTeam(); } catch { return { title: t('nav.team'), el: h('div', { class: 'container section' }, h('h1', { class: 'sr-only' }, t('nav.team')), errorState(() => refresh())) }; }
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.about'), href: href('/about') }, { label: t('nav.team') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('team.title')), h('p', { class: 'lead' }, t('team.lead'))),
    h('div', { class: 'grid grid-3' }, d.members.map((m) => teamCard(m, { level: 2 }))),
    h('p', { class: 'muted spaced' }, t('team.englishNote')));
  return { title: t('nav.team'), description: t('team.lead'), el };
}
