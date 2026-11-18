import { setKids } from '../util/dom.js';
import { h, icon } from '../util/dom.js';
import { t, getLanguage } from '../core/i18n.js';
import { buildSearchIndex, searchItems } from '../core/search.js';
import { breadcrumb } from '../ui/layout.js';
import { href } from '../core/router.js';
import { emptyState } from './states.js';
import { debounce } from '../util/dom.js';

export default async function searchPage({ query }) {
  const items = await buildSearchIndex(getLanguage());
  const out = h('div', { class: 'search-results', 'aria-live': 'polite' });
  const input = h('input', { id: 'site-q', class: 'input input-lg', type: 'search', value: query.q || '', placeholder: t('search.placeholder'), autocomplete: 'off', enterkeyhint: 'search' });
  const draw = () => {
    const q = input.value.trim();
    if (!q) { setKids(out, h('p', { class: 'muted' }, t('search.hint'))); return; }
    const res = searchItems(items, q);
    if (!res.length) { setKids(out, emptyState({ title: t('ui.noResults'), text: t('search.none', { q }) })); return; }
    setKids(out, h('p', { class: 'muted' }, t('search.count', { n: res.length })), h('ul', { class: 'result-list' }, res.map((r) => h('li', {}, h('a', { class: 'result', href: href(r.url) }, h('span', { class: 'topic-icon' }, icon(r.icon)), h('span', {}, h('span', { class: 'chip' }, t('search.type.' + r.type)), h('strong', { class: 'result-title' }, r.title)), icon('chevron-right', 'card-arrow'))))));
  };
  input.addEventListener('input', debounce(draw, 120)); draw();
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.search') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('nav.search'))), h('label', { for: 'site-q', class: 'sr-only' }, t('search.label')), input, out);
  return { title: t('nav.search'), el, mounted: () => { if (!input.value) input.focus(); } };
}
