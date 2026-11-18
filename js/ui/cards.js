import { h, icon, extLink } from '../util/dom.js';
import { t, getLanguage, languageName, LANGUAGES } from '../core/i18n.js';
import { href } from '../core/router.js';
import { formatDate, isYouTubeId } from '../util/format.js';
import { copyText, shareLinks, nativeShare } from '../util/share.js';
import { toast } from './layout.js';
import { store } from '../util/storage.js';

export const catLabel = (c) => t('cat.' + c);

export function topicCard(tp, { compact = false } = {}) {
  return h('a', { class: 'card topic-card', href: href('/learn/' + tp.id) },
    h('span', { class: 'topic-icon' }, icon(tp.icon)),
    h('span', { class: 'card-body' }, h('h3', { class: 'card-title' }, tp.title), compact ? null : h('p', { class: 'card-text' }, tp.summary)),
    h('span', { class: 'card-meta' }, icon('clock'), t('ui.minRead', { n: tp.minutes }), icon('chevron-right', 'card-arrow')));
}

export function articleCard(a, { featured = false } = {}) {
  return h('article', { class: 'card article-card' + (featured ? ' is-featured' : '') },
    h('p', { class: 'chip' }, catLabel(a.category)),
    h('h3', { class: 'card-title' }, h('a', { href: href('/articles/' + a.id), class: 'stretch' }, a.title)),
    h('p', { class: 'card-text' }, a.summary),
    h('p', { class: 'card-meta' }, icon('clock'), t('ui.minRead', { n: a.readMinutes }), h('span', { class: 'dot', 'aria-hidden': 'true' }), formatDate(a.date, a.datePrecision, getLanguage())));
}

export function thumbSrc(v) { return isYouTubeId(v.youtubeId) && !v.placeholder ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : null; }

/** Small language badges: every language the video exists in; the one being shown is highlighted. */
export function langBadges(v) {
  return h('ul', { class: 'lang-badges', 'aria-label': t('video.availableIn') }, v.available.map((c) => {
    const short = (LANGUAGES.find((l) => l.code === c) || { short: c.toUpperCase() }).short;
    return h('li', { class: 'lang-badge' + (c === v.lang ? ' is-current' : ''), title: languageName(c) }, short, h('span', { class: 'sr-only' }, ' ' + languageName(c)));
  }));
}

export function videoCard(v, { onPlay } = {}) {
  const thumb = thumbSrc(v);
  const playable = !!thumb;
  const media = h('div', { class: 'video-thumb' + (thumb ? '' : ' is-sample') },
    thumb ? h('img', { src: thumb, alt: '', loading: 'lazy', width: 480, height: 360, onError: (e) => { const art = h('div', { class: 'sample-art' }, icon('circle-play'), h('span', {}, t('video.thumbFallback'))); e.currentTarget.replaceWith(art); } }) : h('div', { class: 'sample-art' }, icon('circle-play'), h('span', {}, t('video.sample'))),
    playable ? h('span', { class: 'play-badge' }, icon('play')) : null,
    v.duration ? h('span', { class: 'duration' }, v.duration) : null);
  const notice = !v.exact && getLanguage() !== v.lang ? h('p', { class: 'card-meta' }, icon('info'), t('video.fallbackNote', { language: languageName(getLanguage()), shown: languageName(v.lang) })) : null;
  const body = h('div', { class: 'card-body' },
    h('p', { class: 'chip' }, catLabel(v.category), v.important ? h('span', {}, ' · ' + t('video.important')) : null),
    h('h3', { class: 'card-title' }, v.title),
    h('p', { class: 'card-text' }, v.placeholder ? t('video.sampleDescription') : v.description),
    langBadges(v), notice);
  if (!playable) return h('article', { class: 'card video-card' }, media, body);
  return h('article', { class: 'card video-card' }, h('button', { class: 'video-open', type: 'button', onClick: () => onPlay?.(v), 'aria-label': t('video.play', { title: v.title }) }, media), body);
}

/** Privacy-enhanced embed (youtube-nocookie), sandboxed, only created after the person chooses to play. */
export function videoEmbed(v) {
  if (!isYouTubeId(v.youtubeId)) return null;
  return h('div', { class: 'video-frame' }, h('iframe', {
    src: `https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&autoplay=1`, title: v.title, loading: 'lazy',
    allow: 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true,
    referrerpolicy: 'strict-origin-when-cross-origin', sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox',
  }));
}

export function tipCard(tip, { hero = false } = {}) {
  const url = location.href.split('#')[0] + '#/tips';
  const text = tip.text;
  const share = async () => {
    if (await nativeShare('CloudSentinel CyberAware', text, url)) return;
    const l = shareLinks(`${text} — CloudSentinel CyberAware`, url);
    const menu = h('div', { class: 'share-pop', role: 'group', 'aria-label': t('ui.share') },
      ['whatsapp', 'x', 'facebook', 'telegram', 'linkedin'].map((k) => extLink(l[k], t('share.' + k))));
    card.append(menu); setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  };
  const card = h('article', { class: 'card tip-card' + (hero ? ' is-hero' : '') },
    h('p', { class: 'chip' }, icon('lightbulb'), catLabel('tip-' + tip.category)),
    h('p', { class: 'tip-text' }, text),
    !tip._translated && getLanguage() !== 'en' ? h('p', { class: 'card-meta' }, t('ui.englishOnly')) : null,
    h('div', { class: 'tip-actions' },
      h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onClick: async () => { toast((await copyText(text)) ? t('ui.copied') : t('ui.copyFailed')); } }, icon('copy'), t('ui.copy')),
      h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onClick: share }, icon('share-2'), t('ui.share'))));
  return card;
}

/* bookmarks (stored locally on the device only) */
export const bookmarks = {
  all: () => store.get('cs-bookmarks', []),
  has: (id) => bookmarks.all().includes(id),
  toggle(id) { const a = bookmarks.all(); const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); store.set('cs-bookmarks', a); return i < 0; },
};

export function teamCard(m, { level = 3 } = {}) {
  const initials = m.initials || (m.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return h('article', { class: 'card team-card' },
    m.photo ? h('img', { class: 'avatar', src: m.photo, alt: '', width: 96, height: 96, loading: 'lazy' }) : h('div', { class: 'avatar avatar-ph', 'aria-hidden': 'true' }, initials),
    h('h' + level, { class: 'card-title' }, m.name), h('p', { class: 'team-role' }, m.role),
    m.bio ? h('p', { class: 'card-text' }, m.bio) : null,
    m.expertise?.length ? h('ul', { class: 'chip-list' }, m.expertise.map((e) => h('li', { class: 'chip' }, e))) : null,
    m.links?.linkedin ? h('p', {}, extLink(m.links.linkedin, icon('external-link'), 'LinkedIn')) : null);
}
