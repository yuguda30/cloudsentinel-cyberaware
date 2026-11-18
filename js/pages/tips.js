import { setKids } from '../util/dom.js';
import { h, icon, norm } from '../util/dom.js';
import { t, localizeAll } from '../core/i18n.js';
import { getTips } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { tipCard, catLabel } from '../ui/cards.js';
import { href } from '../core/router.js';
import { dayOfYear } from '../util/format.js';
import { emptyState, errorState } from './states.js';

const CATS = ['general', 'passwords', 'phishing', 'mobile', 'social', 'banking', 'privacy', 'browsing', 'scams'];
export default async function tipsPage() {
  let tips; try { tips = localizeAll('tips', await getTips()); } catch { return { title: t('nav.tips'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }
  const state = { cat: 'all', q: '' };
  const grid = h('div', { class: 'grid grid-3' }); const chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('tips.categories') });
  const today = tips[dayOfYear() % tips.length];
  const draw = () => {
    setKids(chips, ...['all', ...CATS].map((c) => h('button', { type: 'button', class: 'chip-btn' + (state.cat === c ? ' is-on' : ''), 'aria-pressed': String(state.cat === c), onClick: () => { state.cat = c; draw(); } }, c === 'all' ? t('ui.all') : catLabel('tip-' + c), h('span', { class: 'chip-n' }, String(c === 'all' ? tips.length : tips.filter((x) => x.category === c).length)))));
    const q = norm(state.q);
    const list = tips.filter((x) => (state.cat === 'all' || x.category === state.cat) && (!q || norm(x.text).includes(q)));
    setKids(grid, ...(list.length ? list.map((x) => tipCard(x)) : [emptyState({ icon: 'lightbulb', title: t('ui.noResults'), text: t('tips.none') })]));
  };
  draw();
  const el = h('div', { class: 'container section page-head-wrap' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.tips') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('tips.title')), h('p', { class: 'lead' }, t('tips.lead'))),
    h('section', { 'aria-labelledby': 'today-h' }, h('h2', { id: 'today-h', class: 'h3' }, t('tips.today')), tipCard(today, { hero: true })),
    h('div', { class: 'filter-row spaced' }, h('label', { for: 'tip-q', class: 'sr-only' }, t('tips.search')), h('input', { id: 'tip-q', type: 'search', class: 'input', placeholder: t('tips.searchPlaceholder'), autocomplete: 'off', onInput: (e) => { state.q = e.target.value; draw(); } })),
    chips, h('div', { class: 'spaced' }, grid));
  return { title: t('nav.tips'), description: t('tips.lead'), el };
}
