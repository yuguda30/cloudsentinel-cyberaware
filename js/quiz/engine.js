// Pure quiz logic (no DOM) so it can be unit-tested in Node.
// The answer key lives only inside the session closure: it is never written to the DOM,
// and a question's correct option is revealed only after that question has been answered.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates; returns a new array. */
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `count` distinct questions, optionally filtered by topic. Returns fewer if the pool is smaller. */
export function selectQuestions(bank, { topic = 'all', count = 10, rng = Math.random } = {}) {
  const pool = topic === 'all' ? bank : bank.filter((q) => q.topic === topic);
  return shuffle(pool, rng).slice(0, Math.max(0, count));
}

export function validateQuestion(q) {
  const errs = [];
  if (!q.id) errs.push('missing id');
  if (!q.q || typeof q.q !== 'string') errs.push('missing question text');
  if (!Array.isArray(q.options) || q.options.length < 2) errs.push('needs 2+ options');
  else {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push('answer index out of range');
    if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== q.options.length) errs.push('duplicate options');
  }
  return errs;
}

export const TIERS = [
  { min: 90, key: 'excellent' },
  { min: 70, key: 'good' },
  { min: 50, key: 'fair' },
  { min: 0, key: 'practise' },
];
export function tierFor(percent) { return TIERS.find((t) => percent >= t.min).key; }

export function createSession(questions, { shuffleOptions = true, rng = Math.random } = {}) {
  const items = questions.map((q) => {
    const order = shuffleOptions ? shuffle(q.options.map((_, i) => i), rng) : q.options.map((_, i) => i);
    return {
      id: q.id, topic: q.topic, scenario: q.scenario || null, text: q.q,
      options: order.map((orig, pos) => ({ key: String.fromCharCode(97 + pos), text: q.options[orig], _orig: orig })),
      _correct: q.answer, explanation: q.explanation || '', picked: null, finished: false,
    };
  });
  let finished = false;

  const view = (i, reveal) => {
    const it = items[i];
    const answered = it.picked !== null;
    const correctKey = (answered || reveal) ? it.options.find((o) => o._orig === it._correct).key : null;
    return {
      index: i, id: it.id, topic: it.topic, scenario: it.scenario, text: it.text,
      options: it.options.map((o) => ({ key: o.key, text: o.text })),
      pickedKey: it.picked, answered, correctKey,
      isCorrect: answered ? it.options.find((o) => o.key === it.picked)._orig === it._correct : null,
      explanation: (answered || reveal) ? it.explanation : '',
    };
  };

  return {
    total: items.length,
    get finished() { return finished; },
    question: (i) => view(i, false),
    answeredCount: () => items.filter((x) => x.picked !== null).length,
    /** Lock in an answer. Returns the feedback for that question only. */
    answer(i, key) {
      const it = items[i];
      if (!it) throw new Error('No such question');
      if (finished) throw new Error('Quiz already finished');
      if (it.picked !== null) return view(i, false);   // already answered: ignore changes
      if (!it.options.some((o) => o.key === key)) throw new Error('No such option');
      it.picked = key;
      return view(i, false);
    },
    finish() {
      finished = true;
      let score = 0;
      const byTopic = {};
      const review = items.map((it, i) => {
        const v = view(i, true);
        const correct = v.isCorrect === true;
        if (correct) score++;
        const bt = (byTopic[it.topic] ||= { correct: 0, total: 0 });
        bt.total++; if (correct) bt.correct++;
        return { ...v, correct, unanswered: !v.answered };
      });
      const total = items.length;
      const percent = total ? Math.round((score / total) * 100) : 0;
      return { score, total, percent, unanswered: review.filter((r) => r.unanswered).length, tier: tierFor(percent), review, byTopic };
    },
  };
}
