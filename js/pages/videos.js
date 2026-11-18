import { setKids } from '../util/dom.js';
import { h, icon, norm } from '../util/dom.js';
import { t, localizeAll, languageName } from '../core/i18n.js';
import { getVideos, getTopics } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { videoCard, videoEmbed, catLabel, thumbSrc, langBadges } from '../ui/cards.js';
import { resolveVideo, hasLanguage } from '../core/videos.js';
import { getLanguage, LANGUAGES } from '../core/i18n.js';
import { href } from '../core/router.js';
import { emptyState, errorState } from './states.js';

const CATS = ['awareness', 'fraud', 'phishing', 'passwords', 'privacy', 'students', 'business', 'hausa', 'general'];

export default async function videosPage() {
  let videos, topics;
  try { [videos, topics] = await Promise.all([getVideos(), getTopics()]); }
  catch { return { title: t('nav.videos'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }
  const state = { cat: 'all', q: '', lang: 'all' };
  const lang = getLanguage();
  const view = () => videos.map((v) => resolveVideo(v, state.lang === 'all' ? lang : state.lang));
  const grid = h('div', { class: 'grid grid-3' });
  const featuredWrap = h('section', { 'aria-labelledby': 'feat-h' });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('videos.categories') });
  const dialog = h('dialog', { class: 'video-dialog', 'aria-label': t('videos.player') });
  const stage = h('div', { class: 'video-stage' });
  dialog.append(h('button', { class: 'icon-btn dialog-close', type: 'button', 'aria-label': t('ui.close'), onClick: () => dialog.close() }, icon('x')), stage);
  dialog.addEventListener('close', () => { setKids(stage, ); opener?.focus(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  let opener = null;
  const play = (v) => {
    opener = document.activeElement;
    const raw = videos.find((x) => x.id === v.id);
    const show = (code) => {
      const cur = resolveVideo(raw, code, code);
      const emb = videoEmbed(cur); if (!emb) return;
      const switcher = cur.playable.length > 1 ? h('div', { class: 'segmented', role: 'group', 'aria-label': t('video.watchIn') }, cur.playable.map((c) => h('button', { type: 'button', class: 'seg' + (c === cur.lang ? ' is-on' : ''), 'aria-pressed': String(c === cur.lang), lang: c, onClick: () => show(c) }, languageName(c)))) : null;
      setKids(stage, h('h2', { class: 'h4 video-title' }, cur.title), switcher, emb, h('p', { class: 'card-meta' }, t('videos.privacyNote')), h('a', { class: 'link-more', href: `https://www.youtube.com/watch?v=${cur.youtubeId}`, target: '_blank', rel: 'noopener noreferrer' }, t('videos.openYoutube'), icon('external-link')));
    };
    show(v.exact || !v.playable.length ? v.lang : (v.playable.includes(lang) ? lang : v.lang));
    dialog.showModal();
  };
  const langs = LANGUAGES.map((l) => l.code).filter((c) => videos.some((v) => hasLanguage(v, c)));
  const draw = () => {
    setKids(chips, ...['all', ...CATS].map((c) => { const n = c === 'all' ? videos.length : videos.filter((v) => v.category === c).length; return h('button', { type: 'button', class: 'chip-btn' + (state.cat === c ? ' is-on' : ''), 'aria-pressed': String(state.cat === c), onClick: () => { state.cat = c; draw(); } }, c === 'all' ? t('ui.all') : catLabel(c), h('span', { class: 'chip-n' }, String(n))); }));
    const q = norm(state.q);
    const list = view().filter((v) => (state.cat === 'all' || v.category === state.cat) && (state.lang === 'all' || hasLanguage(v, state.lang)) && (!q || norm(Object.values(v.variants).map((x) => x.title).join(' ')).includes(q)));
    setKids(grid, ...(list.length ? list.map((v) => videoCard(v, { onPlay: play })) : [emptyState({ icon: 'circle-play', title: t('videos.none'), text: t('videos.noneText') })]));
    const feat = view().filter((v) => v.featured && state.cat === 'all' && !q && state.lang === 'all');
    setKids(featuredWrap, ...(feat.length ? [h('h2', { id: 'feat-h', class: 'h3' }, t('videos.featured')), h('div', { class: 'grid grid-3' }, feat.slice(0, 3).map((v) => videoCard(v, { onPlay: play })))] : []));
  };
  const search = h('input', { id: 'vid-q', type: 'search', class: 'input', placeholder: t('videos.searchPlaceholder'), autocomplete: 'off', onInput: (e) => { state.q = e.target.value; draw(); } });
  const langSel = h('select', { class: 'input', 'aria-label': t('videos.language'), onChange: (e) => { state.lang = e.target.value; draw(); } }, h('option', { value: 'all' }, t('videos.allLanguages')), langs.map((l) => h('option', { value: l }, languageName(l))));
  const allSamples = videos.every((v) => Object.values(v.variants).every((x) => x.placeholder));
  const el = h('div', { class: 'container section page-head-wrap' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.videos') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('videos.title')), h('p', { class: 'lead' }, t('videos.lead'))),
    allSamples ? h('p', { class: 'notice', role: 'note' }, icon('info'), t('videos.sampleNotice')) : null,
    h('div', { class: 'filter-row' }, h('label', { for: 'vid-q', class: 'sr-only' }, t('videos.search')), search, langSel),
    chips, featuredWrap, h('div', { class: 'spaced' }, grid), dialog);
  draw();
  return { title: t('nav.videos'), description: t('videos.lead'), el, cleanup: () => dialog.open && dialog.close() };
}
