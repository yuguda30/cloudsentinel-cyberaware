import { setKids } from '../util/dom.js';
import { h, icon } from '../util/dom.js';
import { t, localizeAll, localize, getLanguage } from '../core/i18n.js';
import { getTopics, getVideos, getTips, getArticles, getQuestions, getTeam } from '../core/data.js';
import { href, refresh } from '../core/router.js';
import { topicCard, articleCard, videoCard, tipCard, teamCard } from '../ui/cards.js';
import { spotFlags } from '../ui/spotflags.js';
import { resolveVideo } from '../core/videos.js';
import { dayOfYear } from '../util/format.js';
import { errorState } from './states.js';

const section = (cls, id, head, ...body) => h('section', { class: 'section ' + cls, 'aria-labelledby': id }, h('div', { class: 'container' }, head ? h('div', { class: 'section-head', 'data-reveal': '' }, h('h2', { id, class: 'h2' }, head.title), head.text ? h('p', { class: 'lead' }, head.text) : null, head.link ? h('a', { class: 'link-more', href: head.link[1] }, head.link[0], icon('arrow-right')) : null) : null, ...body));

const load = (p) => p.then((v) => ({ ok: true, v }), (e) => ({ ok: false, e }));
/** A small inline notice that replaces one section when its data can't load. The rest of the page still renders. */
function softError(id, title) {
  return h('section', { class: 'section', 'aria-labelledby': id }, h('div', { class: 'container' },
    h('h2', { id, class: 'h2' }, title),
    h('div', { class: 'notice', role: 'status' }, h('span', {}, t('state.sectionError')), h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onClick: () => refresh() }, icon('refresh-cw'), t('ui.retry')))));
}
/** Build a section; if its data is missing or its builder throws, show softError instead of breaking the page. */
function guarded(id, title, needs, build) {
  try {
    if (needs.some((r) => !r.ok)) { needs.filter((r) => !r.ok).forEach((r) => console.warn('[home] ' + id, r.e)); return softError(id, title); }
    return build();
  } catch (e) { console.error('[home] section ' + id, e); window.__csNote && window.__csNote('home/' + id + ': ' + e.message); return softError(id, title); }
}

export default async function home() {
  const [tpR, viR, tiR, arR, quR, teR] = await Promise.all([getTopics(), getVideos(), getTips(), getArticles(), getQuestions(), getTeam()].map(load));
  const loc = (kind, r) => (r.ok ? { ok: true, v: localizeAll(kind, r.v) } : r);
  const topicsR = loc('topics', tpR), tipsR = loc('tips', tiR), articlesR = loc('articles', arR), videosR = viR;
  const topics = topicsR.v || [], tips = tipsR.v || [], articles = articlesR.v || [], videos = videosR.v || [], questions = quR.v || [], team = teR.v;
  const failed = [tpR, viR, tiR, arR, quR, teR].filter((r) => !r.ok);
  if (failed.length === 6) return { title: t('nav.home'), el: h('div', { class: 'container section' }, h('h1', { class: 'sr-only' }, t('state.errorTitle')), errorState(() => refresh())) };

  let tipIndex = tips.length ? dayOfYear() % tips.length : 0;
  const tipHost = h('div', {});
  const drawTip = () => { if (tips.length) setKids(tipHost, tipCard(tips[tipIndex], { hero: true })); };
  drawTip();
  const stat = (n, label) => h('li', { class: 'stat' }, h('span', { class: 'stat-n', 'data-count': n }, '0'), h('span', { class: 'stat-l' }, label));
  const featuredIds = ['phishing', 'passwords', 'scams', 'mobile', 'payments', 'social-media'];
  const threatIds = [['phishing', 'fish'], ['scams', 'triangle-alert'], ['mobile', 'smartphone'], ['malware', 'bug'], ['social-media', 'message-circle'], ['payments', 'credit-card']];
  const topicOf = (id) => topics.find((x) => x.id === id);

  const hero = guarded('hero-title', t('hero.title'), [], () => h('section', { class: 'hero', 'aria-labelledby': 'hero-title' }, h('div', { class: 'container hero-grid' },
      h('div', { class: 'hero-copy' },
        h('p', { class: 'hero-brand' }, icon('shield-check'), 'CloudSentinel CyberAware'),
        h('h1', { id: 'hero-title', class: 'display' }, t('hero.title')),
        h('p', { class: 'hero-lead' }, t('hero.lead')),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-gold btn-lg', href: href('/learn') }, icon('graduation-cap'), t('hero.ctaLearn')), h('a', { class: 'btn btn-outline-light btn-lg', href: href('/quiz') }, icon('clipboard-check'), t('hero.ctaQuiz'))),
        h('p', { class: 'hero-tag' }, t('brand.tagline'))),
      h('div', { class: 'hero-demo' }, h('p', { class: 'demo-kicker' }, t('hero.demoKicker')), spotFlags()))));


  const welcome = guarded('welcome-h', t('home.welcomeTitle'), [], () => section('welcome', 'welcome-h', { title: t('home.welcomeTitle'), text: t('home.welcomeText') },
      (tpR.ok && quR.ok && tiR.ok) ? h('ul', { class: 'stats' }, stat(topics.length, t('home.statTopics')), stat(questions.length, t('home.statQuestions')), stat(tips.length, t('home.statTips')), stat(4, t('home.statLanguages'))) : h('ul', { class: 'stats' }, stat(4, t('home.statLanguages')))));
  const why = guarded('why-h', t('home.whyTitle'), [], () => section('why', 'why-h', { title: t('home.whyTitle') },
      h('div', { class: 'why-grid' }, h('p', { class: 'why-statement', 'data-reveal': '' }, t('home.whyStatement')),
        h('ul', { class: 'why-list' }, ['1', '2', '3'].map((n) => h('li', { 'data-reveal': '' }, icon(['banknote', 'shield-check', 'users'][n - 1]), h('div', {}, h('h3', {}, t(`home.why${n}Title`)), h('p', {}, t(`home.why${n}Text`)))))))));
  const threats = guarded('threats-h', t('home.threatsTitle'), [topicsR], () => section('threats', 'threats-h', { title: t('home.threatsTitle'), text: t('home.threatsText') },
      h('ul', { class: 'threat-grid' }, threatIds.map(([id, ic]) => topicOf(id)).map((tp, i) => tp && h('li', { 'data-reveal': '' }, h('a', { class: 'threat', href: href('/learn/' + tp.id) }, h('span', { class: 'threat-ic' }, icon(threatIds[i][1])), h('span', {}, h('strong', {}, tp.title), h('span', { class: 'threat-text' }, t('threat.' + tp.id))), icon('chevron-right', 'threat-arrow')))))));
  const learning = guarded('learn-h', t('home.learnTitle'), [topicsR], () => section('learning', 'learn-h', { title: t('home.learnTitle'), text: t('home.learnText'), link: [t('home.learnAll', { n: topics.length }), href('/learn')] },
      h('div', { class: 'grid grid-3', 'data-reveal': '' }, featuredIds.map(topicOf).filter(Boolean).map((tp) => topicCard(tp)))));
  const vids = guarded('videos-h', t('home.videosTitle'), [videosR], () => section('videos', 'videos-h', { title: t('home.videosTitle'), text: t('home.videosText'), link: [t('home.videosAll'), href('/videos')] },
      h('div', { class: 'grid grid-3', 'data-reveal': '' }, videos.filter((v) => v.featured).slice(0, 3).map((v) => resolveVideo(v, getLanguage())).map((v) => videoCard(v, { onPlay: () => { location.hash = '/videos'; } })))));
  const tipSec = guarded('tip-h', t('home.tipTitle'), [tipsR], () => section('tip', 'tip-h', { title: t('home.tipTitle'), link: [t('home.tipsAll'), href('/tips')] },
      tipHost, h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => { tipIndex = (tipIndex + 1) % tips.length; drawTip(); } }, icon('refresh-cw'), t('home.nextTip'))));
  const quiz = guarded('quiz-h', t('home.quizTitle'), [], () => h('section', { class: 'section quiz-band', 'aria-labelledby': 'quiz-h' }, h('div', { class: 'container quiz-band-inner' },
      h('div', {}, h('h2', { id: 'quiz-h', class: 'h2' }, t('home.quizTitle')), h('p', { class: 'lead' }, t('home.quizText'))),
      h('div', { class: 'quiz-quick' }, [10, 20, 50].map((n) => h('a', { class: 'btn btn-light', href: href(`/quiz?n=${n}`) }, t('home.quizN', { n }))), h('a', { class: 'btn btn-outline-light', href: href('/quiz') }, icon('list-checks'), t('home.quizTopic'))))));
  const arts = guarded('articles-h', t('home.articlesTitle'), [articlesR], () => section('articles', 'articles-h', { title: t('home.articlesTitle'), link: [t('home.articlesAll'), href('/articles')] },
      h('div', { class: 'grid grid-3', 'data-reveal': '' }, [...articles].sort((a, b) => (String(b.date) > String(a.date) ? 1 : -1)).slice(0, 3).map((a) => articleCard(a)))));
  const about = guarded('about-h', t('home.aboutTitle'), [], () => section('about-band', 'about-h', { title: t('home.aboutTitle') },
      h('div', { class: 'about-grid' }, h('div', {}, h('p', { class: 'lead' }, t('home.aboutText')), h('p', {}, t('about.mission')), h('a', { class: 'btn btn-primary', href: href('/about') }, t('home.aboutCta'))),
        h('div', { class: 'pillars' }, [['shield-check', 'pillar1'], ['graduation-cap', 'pillar2'], ['heart-handshake', 'pillar3']].map(([ic, k]) => h('div', { class: 'pillar' }, icon(ic), h('div', {}, h('h3', {}, t(`about.${k}Title`)), h('p', {}, t(`about.${k}Text`)))))))));
  const teamSec = guarded('team-h', t('home.teamTitle'), [teR], () => section('team-band', 'team-h', { title: t('home.teamTitle'), link: [t('home.teamAll'), href('/team')] }, h('div', { class: 'grid grid-3', 'data-reveal': '' }, team.members.map((m) => teamCard(m)))));
  const cta = guarded('cta-h', t('home.ctaTitle'), [], () => h('section', { class: 'section cta', 'aria-labelledby': 'cta-h' }, h('div', { class: 'container cta-inner' }, h('h2', { id: 'cta-h', class: 'h2' }, t('home.ctaTitle')), h('p', { class: 'lead' }, t('home.ctaText')), h('div', { class: 'btn-row center' }, h('a', { class: 'btn btn-gold btn-lg', href: href('/learn') }, t('hero.ctaLearn')), h('a', { class: 'btn btn-outline-light btn-lg', href: href('/chat') }, icon('bot'), t('nav.chat'))))));
  const el = h('div', {}, hero, welcome, why, threats, learning, vids, tipSec, quiz, arts, about, teamSec, cta);
  return { title: t('nav.home'), description: t('meta.description'), el };
}
