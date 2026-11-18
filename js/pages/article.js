import { setKids } from '../util/dom.js';
import { h, icon, extLink } from '../util/dom.js';
import { t, localize, localizeAll, getLanguage, hasField, languageName } from '../core/i18n.js';
import { getArticles } from '../core/data.js';
import { breadcrumb, toast } from '../ui/layout.js';
import { articleCard, catLabel, bookmarks } from '../ui/cards.js';
import { href } from '../core/router.js';
import { formatDate } from '../util/format.js';
import { copyText, shareLinks, nativeShare } from '../util/share.js';
import { translationNotice } from './states.js';
import notFound from './states.js';

function renderBlocks(blocks) {
  return blocks.map((b) => {
    if (b.t === 'p') return h('p', {}, b.x);
    if (b.t === 'h') return h('h2', { class: 'h3' }, b.x);
    if (b.t === 'ul') return h('ul', { class: 'bullets' }, b.items.map((i) => h('li', {}, i.b ? h('strong', {}, i.b + ': ') : null, i.x)));
    if (b.t === 'example') return h('aside', { class: 'example' }, h('h3', { class: 'h4' }, icon('lightbulb'), b.title), b.lines.map((l) => h('p', {}, l)));
    return null;
  });
}
export default async function articlePage({ params }) {
  const raw = (await getArticles()).find((a) => a.id === params.id);
  if (!raw) return notFound();
  const a = localize('articles', raw);
  const related = localizeAll('articles', (await getArticles()).filter((x) => x.id !== raw.id && (x.topic === raw.topic || x.category === raw.category))).slice(0, 2);
  const url = location.href.split('#')[0] + '#/articles/' + raw.id;
  const links = shareLinks(a.title, url);
  const bmBtn = h('button', { class: 'btn btn-ghost', type: 'button', 'aria-pressed': String(bookmarks.has(raw.id)), onClick: () => { const on = bookmarks.toggle(raw.id); bmBtn.setAttribute('aria-pressed', String(on)); setKids(bmBtn, icon('bookmark'), on ? t('articles.saved1') : t('articles.save')); toast(on ? t('articles.savedToast') : t('articles.removedToast')); } }, icon('bookmark'), bookmarks.has(raw.id) ? t('articles.saved1') : t('articles.save'));
  const bar = h('div', { class: 'reading-progress', 'aria-hidden': 'true' });
  const body = h('div', { class: 'prose' }, renderBlocks(raw.blocks));
  const upd = () => { const r = body.getBoundingClientRect(); const total = r.height - innerHeight * 0.6; const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1; bar.style.setProperty('--p', (p * 100).toFixed(1) + '%'); };
  addEventListener('scroll', upd, { passive: true });
  const el = h('div', { class: 'container section page-head-wrap' }, bar,
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.articles'), href: href('/articles') }, { label: a.title }]),
    h('article', { class: 'article' },
      h('header', { class: 'page-head' }, h('p', { class: 'chip' }, catLabel(raw.category)), h('h1', { class: 'h1' }, a.title),
        h('p', { class: 'byline' }, h('span', {}, t('articles.by', { author: raw.author })), h('span', { class: 'dot', 'aria-hidden': 'true' }), h('time', { datetime: raw.date }, formatDate(raw.date, raw.datePrecision, getLanguage())), h('span', { class: 'dot', 'aria-hidden': 'true' }), t('ui.minRead', { n: raw.readMinutes }))),
      getLanguage() !== 'en' && !hasField('articles', raw.id, 'blocks') ? translationNotice(getLanguage(), languageName(getLanguage())) : null,
      body,
      h('div', { class: 'article-actions' }, bmBtn,
        h('div', { class: 'share-row', role: 'group', 'aria-label': t('ui.share') }, h('span', { class: 'share-label' }, icon('share-2'), t('ui.share')),
          ['whatsapp', 'x', 'facebook', 'linkedin', 'telegram'].map((k) => extLink(links[k], t('share.' + k))),
          h('button', { class: 'linklike', type: 'button', onClick: async () => { if (!(await nativeShare(a.title, a.title, url))) toast((await copyText(url)) ? t('ui.linkCopied') : t('ui.copyFailed')); } }, icon('link'), t('ui.copyLink'))))),
    related.length ? h('section', { class: 'spaced', 'aria-labelledby': 'rel-h' }, h('h2', { id: 'rel-h', class: 'h3' }, t('topic.relatedArticles')), h('div', { class: 'grid grid-2' }, related.map((r) => articleCard(r)))) : null);
  return { title: a.title, description: a.summary, el, mounted: upd, cleanup: () => removeEventListener('scroll', upd) };
}
