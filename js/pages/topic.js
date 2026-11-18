import { h, icon } from '../util/dom.js';
import { t, localize, localizeAll, hasField, getLanguage, languageName } from '../core/i18n.js';
import { getTopics, getArticles, getVideos, getQuestions } from '../core/data.js';
import { articleCard, videoCard } from '../ui/cards.js';
import { breadcrumb } from '../ui/layout.js';
import { resolveVideo } from '../core/videos.js';
import { miniQuiz } from '../ui/miniquiz.js';
import { href } from '../core/router.js';
import { translationNotice } from './states.js';
import notFound from './states.js';

export default async function topicPage({ params }) {
  const [rawTopics, rawArticles, rawVideos, bank] = await Promise.all([getTopics(), getArticles(), getVideos(), getQuestions()]);
  const idx = rawTopics.findIndex((x) => x.id === params.id);
  if (idx < 0) return notFound();
  const raw = rawTopics[idx];
  const tp = localize('topics', raw);
  const full = hasField('topics', raw.id, 'sections');
  const articles = localizeAll('articles', rawArticles.filter((a) => (raw.related || []).includes(a.id)));
  const videos = rawVideos.filter((v) => v.relatedTopics?.includes(raw.id)).slice(0, 3).map((v) => resolveVideo(v, getLanguage()));
  const nQ = bank.filter((q) => q.topic === raw.id).length;
  const prev = rawTopics[idx - 1], next = rawTopics[idx + 1];
  const nav = (tt, dir) => tt ? h('a', { class: 'pager-link ' + dir, href: href('/learn/' + tt.id) }, h('span', { class: 'pager-dir' }, dir === 'prev' ? t('ui.previous') : t('ui.next')), h('span', { class: 'pager-title' }, localize('topics', tt).title)) : h('span', {});
  const block = (id, title, ...kids) => h('section', { class: 'lesson-block', 'aria-labelledby': id }, h('h2', { id, class: 'h3' }, title), ...kids);

  const el = h('div', { class: 'container section page-head-wrap' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.learn'), href: href('/learn') }, { label: tp.title }]),
    h('div', { class: 'lesson' },
      h('header', { class: 'page-head lesson-head' }, h('span', { class: 'topic-icon big' }, icon(raw.icon)), h('div', {}, h('h1', { class: 'h1' }, tp.title), h('p', { class: 'lead' }, tp.summary), h('p', { class: 'card-meta' }, icon('clock'), t('ui.minRead', { n: raw.minutes }), h('span', { class: 'dot', 'aria-hidden': 'true' }), t('topic.level')))),
      getLanguage() !== 'en' && !full ? translationNotice(getLanguage(), languageName(getLanguage())) : null,
      block('l-intro', t('topic.intro'), h('p', {}, raw.intro)),
      block('l-obj', t('topic.objectives'), h('ul', { class: 'check-list' }, raw.objectives.map((o) => h('li', {}, icon('circle-check'), o)))),
      raw.sections.map((s, i) => h('section', { class: 'lesson-block', 'aria-labelledby': 'l-s' + i }, h('h2', { id: 'l-s' + i, class: 'h3' }, s.h), s.p.map((p) => h('p', {}, p)))),
      h('aside', { class: 'example', 'aria-labelledby': 'l-ex' }, h('h2', { id: 'l-ex', class: 'h4' }, icon('lightbulb'), raw.example.title), h('p', {}, raw.example.text)),
      block('l-prev', t('topic.prevention'), h('ul', { class: 'check-list' }, raw.prevention.map((o) => h('li', {}, icon('shield-check'), o)))),
      h('section', { class: 'takeaways', 'aria-labelledby': 'l-key' }, h('h2', { id: 'l-key', class: 'h3' }, t('topic.takeaways')), h('ul', {}, (tp.takeaways || raw.takeaways).map((k) => h('li', {}, k)))),
      block('l-quiz', t('topic.practice'), miniQuiz(bank, raw.id) || h('p', {}, t('topic.noQuiz')), nQ ? h('p', {}, h('a', { class: 'btn btn-primary', href: href('/quiz/' + raw.id) }, icon('clipboard-check'), t('topic.takeQuiz', { n: nQ }))) : null),
      articles.length ? block('l-art', t('topic.relatedArticles'), h('div', { class: 'grid grid-2' }, articles.map((a) => articleCard(a)))) : null,
      videos.length ? block('l-vid', t('topic.relatedVideos'), h('div', { class: 'grid grid-3' }, videos.map((v) => videoCard(v, { onPlay: () => { location.hash = '/videos'; } })))) : null,
      h('nav', { class: 'pager', 'aria-label': t('ui.pager') }, nav(prev, 'prev'), nav(next, 'next'))));
  return { title: tp.title, description: tp.summary, el };
}
