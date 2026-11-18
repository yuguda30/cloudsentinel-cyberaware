import { h, icon } from '../util/dom.js';
import { t, localizeAll } from '../core/i18n.js';
import { getArticles } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { articleCard, bookmarks } from '../ui/cards.js';
import { href } from '../core/router.js';
import { emptyState } from './states.js';
export default async function saved() {
  const ids = bookmarks.all(); const list = localizeAll('articles', (await getArticles()).filter((a) => ids.includes(a.id)));
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.articles'), href: href('/articles') }, { label: t('nav.saved') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('nav.saved')), h('p', { class: 'lead' }, t('saved.lead'))),
    list.length ? h('div', { class: 'grid grid-3' }, list.map((a) => articleCard(a))) : emptyState({ icon: 'bookmark', title: t('saved.emptyTitle'), text: t('saved.emptyText'), action: h('a', { class: 'btn btn-primary', href: href('/articles') }, t('nav.articles')) }));
  return { title: t('nav.saved'), el };
}
