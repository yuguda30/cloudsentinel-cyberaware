import { setKids } from '../util/dom.js';
import { h, icon, announce } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { createSession, selectQuestions } from '../quiz/engine.js';
import { href } from '../core/router.js';

/** A short inline practice set (used on topic pages). Feedback is immediate; answers are locked once chosen. */
export function miniQuiz(bank, topicId, { count = 3 } = {}) {
  const qs = selectQuestions(bank, { topic: topicId, count });
  if (!qs.length) return null;
  const s = createSession(qs);
  let i = 0;
  const host = h('div', { class: 'miniquiz' });
  const draw = () => {
    if (i >= s.total) {
      const r = s.finish();
      setKids(host, h('div', { class: 'mini-result' }, h('p', { class: 'mini-score' }, t('quiz.scoreOf', { score: r.score, total: r.total })), h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => { location.reload(); } }, icon('rotate-ccw'), t('quiz.tryAgain')),
        h('a', { class: 'btn btn-primary', href: href('/quiz/' + topicId) }, t('topic.moreQuestions')))));
      return;
    }
    const q = s.question(i);
    const fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const opts = q.options.map((o) => h('button', { type: 'button', class: 'option', onClick: () => {
      const r = s.answer(i, o.key);
      opts.forEach((b, bi) => { const ok = q.options[bi].key === r.correctKey; b.disabled = true; b.classList.toggle('is-correct', ok); b.classList.toggle('is-wrong', q.options[bi].key === r.pickedKey && !ok); });
      setKids(fb, h('p', { class: r.isCorrect ? 'fb-ok' : 'fb-bad' }, icon(r.isCorrect ? 'circle-check' : 'circle-x'), r.isCorrect ? t('quiz.correct') : t('quiz.incorrect')), r.explanation ? h('p', {}, r.explanation) : null,
        h('button', { class: 'btn btn-sm btn-primary', type: 'button', onClick: () => { i++; draw(); } }, i + 1 < s.total ? t('quiz.next') : t('quiz.finish')));
      announce(r.isCorrect ? t('quiz.correct') : t('quiz.incorrect'));
    } }, h('span', {}, o.text)));
    setKids(host, h('p', { class: 'mini-progress' }, t('quiz.questionOf', { n: i + 1, total: s.total })), q.scenario ? h('p', { class: 'scenario' }, q.scenario) : null, h('p', { class: 'q-text' }, q.text), h('div', { class: 'options' }, opts), fb);
  };
  draw();
  return host;
}
