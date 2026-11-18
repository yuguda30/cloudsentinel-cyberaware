import { norm } from '../util/dom.js';
import { t, localizeAll } from './i18n.js';
import { resolveVideo } from './videos.js';
import { getTopics, getArticles, getTips, getVideos } from './data.js';

let cacheKey = '', index = [];
export async function buildSearchIndex(lang) {
  if (cacheKey === lang && index.length) return index;
  const [tp, ar, ti, vi] = await Promise.all([getTopics(), getArticles(), getTips(), getVideos()]);
  const items = [];
  localizeAll('topics', tp).forEach((x) => items.push({ type: 'topic', id: x.id, title: x.title, text: `${x.summary} ${x.intro}`, url: `/learn/${x.id}`, icon: x.icon }));
  localizeAll('articles', ar).forEach((x) => items.push({ type: 'article', id: x.id, title: x.title, text: x.summary, url: `/articles/${x.id}`, icon: 'newspaper' }));
  localizeAll('tips', ti).forEach((x) => items.push({ type: 'tip', id: x.id, title: x.text.length > 80 ? x.text.slice(0, 77) + '…' : x.text, text: x.text, url: '/tips', icon: 'lightbulb' }));
  vi.map((v) => resolveVideo(v, lang)).forEach((x) => items.push({ type: 'video', id: x.id, title: x.title, text: Object.values(x.variants).map((y) => y.title).join(' '), url: '/videos', icon: 'circle-play' }));
  for (const [id, path, ic] of [['quiz', '/quiz', 'clipboard-check'], ['chat', '/chat', 'bot'], ['about', '/about', 'building-2'], ['team', '/team', 'users'], ['contact', '/contact', 'mail'], ['privacy', '/privacy', 'lock'], ['terms', '/terms', 'file-text']])
    items.push({ type: 'page', id, title: t('nav.' + id), text: '', url: path, icon: ic });
  for (const it of items) { it.nt = norm(it.title); it.nx = norm(it.text); }
  cacheKey = lang; index = items; return items;
}
export function searchItems(items, query, limit = 40) {
  const q = norm(query); if (!q) return [];
  const words = q.split(' ');
  const res = [];
  for (const it of items) {
    let s = 0;
    if (it.nt === q) s += 100;
    if (it.nt.includes(q)) s += 40;
    for (const w of words) { if (it.nt.includes(w)) s += 12; if (it.nx.includes(w)) s += 3; }
    if (words.every((w) => it.nt.includes(w) || it.nx.includes(w))) s += 10; else if (words.length > 1) s = Math.floor(s / 3);
    if (s > 5) res.push({ it, s });
  }
  return res.sort((a, b) => b.s - a.s).slice(0, limit).map((r) => r.it);
}
