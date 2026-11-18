import { setKids, jumpTo } from '../util/dom.js';
import { h, icon, announce } from '../util/dom.js';
import { t, localizeAll, getLanguage, languageName } from '../core/i18n.js';
import { getTopics, getQuestions } from '../core/data.js';
import { breadcrumb, toast } from '../ui/layout.js';
import { href } from '../core/router.js';
import { createSession, selectQuestions } from '../quiz/engine.js';
import { store } from '../util/storage.js';
import { copyText } from '../util/share.js';
import { errorState } from './states.js';

const SECONDS_PER_QUESTION = 45;
const COUNTS = [10, 20, 50];

export default async function quizPage({ params, query }) {
  let topics, bank;
  try { [topics, bank] = await Promise.all([getTopics(), getQuestions()]); topics = localizeAll('topics', topics); bank = localizeAll('questions', bank); }
  catch { return { title: t('nav.quiz'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }

  const root = h('div', { class: 'container section page-head-wrap quiz-page' });
  let timerId = null;
  const cleanup = () => { clearInterval(timerId); timerId = null; };
  const settings = { topic: params.topic && topics.some((x) => x.id === params.topic) ? params.topic : 'all', count: COUNTS.includes(Number(query.n)) ? Number(query.n) : 10, timed: false, langOnly: false };

  const pool = () => bank.filter((q) => (settings.topic === 'all' || q.topic === settings.topic) && (!settings.langOnly || q._translated));
  const topicTitle = (id) => topics.find((x) => x.id === id)?.title || id;

  /* ---------------- setup ---------------- */
  function drawSetup() {
    cleanup();
    const lang = getLanguage();
    const topicSel = h('select', { id: 'qz-topic', class: 'input', onChange: (e) => { settings.topic = e.target.value; refreshInfo(); } },
      h('option', { value: 'all' }, t('quiz.allTopics', { n: bank.length })),
      topics.map((tp) => h('option', { value: tp.id, selected: tp.id === settings.topic }, `${tp.title} (${bank.filter((q) => q.topic === tp.id).length})`)));
    topicSel.value = settings.topic;
    const info = h('p', { class: 'form-hint', 'aria-live': 'polite' });
    const seg = (name, items, cur, onPick) => h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': name }, items.map(([v, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === cur()), class: 'seg' + (v === cur() ? ' is-on' : ''), onClick: (e) => { onPick(v); e.currentTarget.parentElement.querySelectorAll('.seg').forEach((b) => { const on = b === e.currentTarget; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); }); refreshInfo(); } }, label)));
    const langCount = bank.filter((q) => q._translated).length;
    const langBox = lang !== 'en' ? h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: settings.langOnly, disabled: langCount < 3, onChange: (e) => { settings.langOnly = e.target.checked; refreshInfo(); } }), h('span', {}, t('quiz.langOnly', { language: languageName(lang), n: langCount }))) : null;
    const start = h('button', { class: 'btn btn-primary btn-lg', type: 'button', onClick: () => startQuiz() }, icon('play'), t('quiz.start'));
    function refreshInfo() {
      const p = pool().length, n = Math.min(settings.count, p);
      info.textContent = p ? t('quiz.willAsk', { n, pool: p }) + (settings.timed ? ' ' + t('quiz.timeLimit', { min: Math.ceil((n * SECONDS_PER_QUESTION) / 60) }) : '') : t('quiz.noneAvailable');
      start.disabled = !p;
    }
    const best = store.get('cs-quiz-best', null);
    setKids(root, 
      breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.quiz') }]),
      h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('quiz.title')), h('p', { class: 'lead' }, t('quiz.lead'))),
      h('form', { class: 'panel quiz-setup', onSubmit: (e) => { e.preventDefault(); startQuiz(); } },
        h('div', { class: 'field' }, h('label', { for: 'qz-topic', class: 'label' }, t('quiz.topic')), topicSel),
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'qz-count-l' }, t('quiz.howMany')), seg(t('quiz.howMany'), COUNTS.map((n) => [n, t('quiz.nQuestions', { n })]), () => settings.count, (v) => { settings.count = v; })),
        h('div', { class: 'field' }, h('span', { class: 'label' }, t('quiz.timer')), seg(t('quiz.timer'), [[false, t('quiz.untimed')], [true, t('quiz.timed')]], () => settings.timed, (v) => { settings.timed = v; })),
        langBox, info,
        h('div', { class: 'btn-row' }, start)),
      best ? h('p', { class: 'form-hint' }, icon('trophy'), t('quiz.best', { percent: best.percent, date: best.date })) : null,
      h('p', { class: 'form-hint' }, icon('info'), t('quiz.privacyNote')));
    refreshInfo();
  }

  /* ---------------- play ---------------- */
  function startQuiz() {
    const qs = selectQuestions(pool(), { count: settings.count });
    if (!qs.length) return;
    const session = createSession(qs);
    let i = 0;
    let remaining = settings.timed ? qs.length * SECONDS_PER_QUESTION : null;
    const timerEl = h('span', { class: 'timer', role: 'timer', 'aria-live': 'off' });
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-labelledby': 'quiz-progress-label', 'aria-valuemin': 0, 'aria-valuemax': session.total });
    const label = h('span', { class: 'progress-label', id: 'quiz-progress-label' });
    const body = h('div', { class: 'qcard' });
    const dots = h('ol', { class: 'qnav', 'aria-label': t('quiz.navigator') });
    const finishNow = (timeUp = false) => { cleanup(); drawResults(session.finish(), timeUp); };

    if (settings.timed) {
      timerEl.textContent = fmt(remaining);
      timerId = setInterval(() => {
        remaining--; timerEl.textContent = fmt(Math.max(0, remaining));
        timerEl.classList.toggle('is-low', remaining <= 30);
        if (remaining === 60 || remaining === 30 || remaining === 10) announce(t('quiz.secondsLeft', { s: remaining }));
        if (remaining <= 0) finishNow(true);
      }, 1000);
    }

    function draw(focus = true) {
      const q = session.question(i);
      bar.setAttribute('aria-valuenow', i + 1); bar.style.setProperty('--p', `${((i + 1) / session.total) * 100}%`);
      label.textContent = t('quiz.questionOf', { n: i + 1, total: session.total });
      const fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
      const optEls = q.options.map((o, oi) => h('button', { type: 'button', class: 'option', dataset: { key: o.key }, onClick: () => choose(o.key) }, h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, String(oi + 1)), h('span', { class: 'opt-text' }, o.text), h('span', { class: 'opt-mark', 'aria-hidden': 'true' })));
      const paint = (r) => {
        optEls.forEach((b, bi) => {
          const key = r.options[bi].key, ok = key === r.correctKey, mine = key === r.pickedKey;
          b.disabled = true; b.classList.toggle('is-correct', ok); b.classList.toggle('is-wrong', mine && !ok);
          setKids(b.querySelector('.opt-mark'), ok ? icon('circle-check') : mine ? icon('circle-x') : '');
          if (ok) b.append(h('span', { class: 'sr-only' }, ' — ' + t('quiz.correctAnswer'))); else if (mine) b.append(h('span', { class: 'sr-only' }, ' — ' + t('quiz.yourAnswer')));
        });
        setKids(fb, h('p', { class: r.isCorrect ? 'fb-ok' : 'fb-bad' }, icon(r.isCorrect ? 'circle-check' : 'circle-x'), r.isCorrect ? t('quiz.correct') : t('quiz.incorrect')), r.explanation ? h('p', {}, r.explanation) : null);
      };
      function choose(key) { const r = session.answer(i, key); paint(r); drawDots(); announce(r.isCorrect ? t('quiz.correct') : t('quiz.incorrect')); }
      if (q.answered) paint(q);
      const last = i === session.total - 1;
      setKids(body, 
        q.scenario ? h('p', { class: 'scenario' }, icon('info'), q.scenario) : null,
        h('h2', { class: 'q-text', id: 'q-title', tabindex: '-1' }, q.text),
        h('p', { class: 'chip' }, topicTitle(q.topic)),
        h('div', { class: 'options', role: 'group', 'aria-labelledby': 'q-title' }, optEls), fb,
        h('div', { class: 'qactions' },
          h('button', { class: 'btn btn-ghost', type: 'button', disabled: i === 0, onClick: () => { i--; draw(); } }, icon('arrow-left'), t('ui.previous')),
          last ? h('button', { class: 'btn btn-primary', type: 'button', onClick: () => finishNow() }, icon('check'), t('quiz.finish'))
            : h('button', { class: 'btn btn-primary', type: 'button', onClick: () => { i++; draw(); } }, t('quiz.next'), icon('arrow-right'))));
      drawDots();
      if (focus) body.querySelector('#q-title').focus({ preventScroll: true });
      jumpTo(Math.max(0, root.offsetTop - 70));
    }
    function drawDots() {
      setKids(dots, ...Array.from({ length: session.total }, (_, n) => { const v = session.question(n); return h('li', {}, h('button', { type: 'button', class: 'qdot' + (n === i ? ' is-current' : '') + (v.answered ? ' is-done' : ''), 'aria-current': n === i ? 'step' : null, 'aria-label': t('quiz.goTo', { n: n + 1 }) + (v.answered ? ' — ' + t('quiz.answered') : ''), onClick: () => { i = n; draw(); } }, String(n + 1))); }));
    }
    setKids(root, 
      h('div', { class: 'quiz-top' }, h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onClick: () => { if (session.answeredCount() === 0 || confirm(t('quiz.confirmQuit'))) drawSetup(); } }, icon('x'), t('quiz.quit')), h('h1', { class: 'quiz-topic-name' }, settings.topic === 'all' ? t('quiz.mixed') : topicTitle(settings.topic)), settings.timed ? h('span', { class: 'timer-wrap' }, icon('timer'), timerEl) : null),
      h('div', { class: 'progress-wrap' }, label, bar), body, dots);
    draw(false);
  }

  /* ---------------- results ---------------- */
  function drawResults(r, timeUp) {
    const hist = { percent: r.percent, date: new Date().toISOString().slice(0, 10) };
    const prev = store.get('cs-quiz-best', null);
    if (!prev || r.percent >= prev.percent) store.set('cs-quiz-best', hist);
    const weak = Object.entries(r.byTopic).filter(([, v]) => v.correct < v.total).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 3);
    const review = h('div', { class: 'review', hidden: true, id: 'review' }, r.review.map((x, n) => h('article', { class: 'review-item ' + (x.correct ? 'ok' : 'bad') },
      h('h3', { class: 'h5' }, icon(x.correct ? 'circle-check' : 'circle-x'), `${n + 1}. ${x.text}`),
      x.scenario ? h('p', { class: 'scenario' }, x.scenario) : null,
      h('ul', { class: 'review-opts' }, x.options.map((o) => h('li', { class: (o.key === x.correctKey ? 'is-correct' : '') + (o.key === x.pickedKey && !x.correct ? ' is-wrong' : '') }, o.text, o.key === x.correctKey ? h('span', { class: 'tag' }, t('quiz.correctAnswer')) : null, o.key === x.pickedKey ? h('span', { class: 'tag' }, t('quiz.yourAnswer')) : null))),
      x.unanswered ? h('p', { class: 'muted' }, t('quiz.notAnswered')) : null, x.explanation ? h('p', {}, x.explanation) : null)));
    const toggle = h('button', { class: 'btn btn-ghost', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'review', onClick: (e) => { review.hidden = !review.hidden; e.currentTarget.setAttribute('aria-expanded', String(!review.hidden)); e.currentTarget.lastChild.textContent = review.hidden ? t('quiz.showReview') : t('quiz.hideReview'); } }, icon('list-checks'), h('span', {}, t('quiz.showReview')));
    setKids(root, 
      h('div', { class: 'result panel' },
        timeUp ? h('p', { class: 'notice' }, icon('timer'), t('quiz.timeUp')) : null,
        h('h1', { class: 'h1', tabindex: '-1' }, t('quiz.resultsTitle')),
        h('div', { class: 'score-ring', style: { '--p': r.percent + '%' }, role: 'img', 'aria-label': `${r.percent}%` }, h('span', { class: 'score-big' }, `${r.score}/${r.total}`), h('span', { class: 'score-pct' }, `${r.percent}%`)),
        h('p', { class: 'lead' }, t('quiz.tier.' + r.tier)),
        r.unanswered ? h('p', { class: 'muted' }, t('quiz.unanswered', { n: r.unanswered })) : null,
        weak.length ? h('div', { class: 'weak' }, h('h2', { class: 'h4' }, t('quiz.reviseTitle')), h('ul', {}, weak.map(([id, v]) => h('li', {}, h('a', { href: href('/learn/' + id) }, topicTitle(id)), ` — ${v.correct}/${v.total}`)))) : null,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-primary', type: 'button', onClick: startQuiz }, icon('rotate-ccw'), t('quiz.retake')),
          h('button', { class: 'btn btn-ghost', type: 'button', onClick: drawSetup }, t('quiz.newQuiz')),
          toggle,
          h('button', { class: 'btn btn-ghost', type: 'button', onClick: async () => toast((await copyText(t('quiz.shareText', { score: r.score, total: r.total, percent: r.percent }) + ' ' + location.href.split('#')[0])) ? t('ui.copied') : t('ui.copyFailed')) }, icon('share-2'), t('quiz.shareScore')))),
      review);
    jumpTo(0);
    root.querySelector('h1')?.focus({ preventScroll: true });
    announce(t('quiz.resultsAnnounce', { score: r.score, total: r.total, percent: r.percent }));
  }

  drawSetup();
  return { title: t('nav.quiz'), description: t('quiz.lead'), el: root, cleanup };
}
