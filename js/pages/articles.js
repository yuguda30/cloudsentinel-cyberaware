import { setKids } from '../util/dom.js';
import { h, icon, norm } from '../util/dom.js';
import { t, localizeAll } from '../core/i18n.js';
import { getArticles } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { articleCard, catLabel, bookmarks } from '../ui/cards.js';
import { href } from '../core/router.js';
import { emptyState, errorState } from './states.js';

const sortDate = (a, b) => (String(b.date) > String(a.date) ? 1 : -1);
export default async function articlesPage() {
  let all; try { all = localizeAll('articles', await getArticles()).sort(sortDate); } catch { return { title: t('nav.articles'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }
  const cats = [...new Set(all.map((a) => a.category))];
  const state = { cat: 'all', q: '' };
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('articles.categories') });
  const featWrap = h('section', { 'aria-labelledby': 'af-h' }); const grid = h('div', { class: 'grid grid-3' });
  const draw = () => {
    setKids(chips, ...['all', ...cats].map((c) => h('button', { type: 'button', class: 'chip-btn' + (state.cat === c ? ' is-on' : ''), 'aria-pressed': String(state.cat === c), onClick: () => { state.cat = c; draw(); } }, c === 'all' ? t('ui.all') : catLabel(c), h('span', { class: 'chip-n' }, String(c === 'all' ? all.length : all.filter((a) => a.category === c).length)))));
    const q = norm(state.q);
    const list = all.filter((a) => (state.cat === 'all' || a.category === state.cat) && (!q || norm(a.title + ' ' + a.summary).includes(q)));
    const showFeat = state.cat === 'all' && !q;
    const feat = showFeat ? list.filter((a) => a.featured) : [];
    setKids(featWrap, ...(feat.length ? [h('h2', { id: 'af-h', class: 'h3' }, t('articles.featured')), h('div', { class: 'grid grid-2' }, feat.map((a) => articleCard(a, { featured: true })))] : []));
    const rest = showFeat ? list.filter((a) => !a.featured) : list;
    setKids(grid, ...(rest.length || feat.length ? rest.map((a) => articleCard(a)) : [emptyState({ icon: 'newspaper', title: t('ui.noResults'), text: t('articles.none') })]));
  };
  draw();
  const el = h('div', { class: 'container section page-head-wrap' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.articles') }]),
    h('header', { class: 'page-head split' }, h('div', {}, h('h1', { class: 'h1' }, t('articles.title')), h('p', { class: 'lead' }, t('articles.lead'))), h('a', { class: 'btn btn-ghost', href: href('/saved') }, icon('bookmark'), t('articles.saved', { n: bookmarks.all().length }))),
    h('div', { class: 'filter-row' }, h('label', { for: 'art-q', class: 'sr-only' }, t('articles.search')), h('input', { id: 'art-q', type: 'search', class: 'input', placeholder: t('articles.searchPlaceholder'), autocomplete: 'off', onInput: (e) => { state.q = e.target.value; draw(); } })),
    chips, featWrap, h('div', { class: 'spaced' }, grid));
  return { title: t('nav.articles'), description: t('articles.lead'), el };
}
