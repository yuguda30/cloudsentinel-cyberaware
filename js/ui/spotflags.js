import { setKids } from '../util/dom.js';
import { h, icon } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { href } from '../core/router.js';

// The scam SMS stays in English on purpose: that is how these messages usually arrive.
// The explanations are translated through the i18n files.
const SEGMENTS = [
  { text: 'ALERT: ' },
  { text: '₦150,000 was debited from your account.', flag: 'fear' },
  { text: ' Not you? ' },
  { text: 'Your account will be blocked in 30 minutes.', flag: 'urgency' },
  { text: ' Confirm your ' },
  { text: 'BVN and OTP', flag: 'secrets' },
  { text: ' at ' },
  { text: 'bit.ly/secure-acct-9', flag: 'link' },
  { text: ' now.' },
];
const FLAGS = ['fear', 'urgency', 'secrets', 'link'];

export function spotFlags() {
  const found = new Set();
  const detail = h('div', { class: 'flag-detail', 'aria-live': 'polite' }, h('p', { class: 'flag-hint' }, icon('info'), t('hero.hint')));
  const count = h('span', { class: 'flag-count' });
  const dots = h('span', { class: 'flag-dots', 'aria-hidden': 'true' }, FLAGS.map(() => h('i', {})));
  const done = h('div', { class: 'flag-done', hidden: true }, h('strong', {}, t('hero.doneTitle')), h('p', {}, t('hero.doneText')), h('a', { class: 'btn btn-sm btn-gold', href: href('/quiz') }, t('hero.doneCta')));
  const upd = () => {
    count.textContent = t('hero.found', { n: found.size, total: FLAGS.length });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i < found.size));
    done.hidden = found.size < FLAGS.length;
  };
  const bubble = h('p', { class: 'sms-text' }, SEGMENTS.map((s) => {
    if (!s.flag) return s.text;
    const b = h('button', { type: 'button', class: 'flag', 'aria-pressed': 'false', onClick: () => {
      found.add(s.flag); b.classList.add('is-found'); b.setAttribute('aria-pressed', 'true');
      setKids(detail, h('p', { class: 'flag-title' }, icon('flag'), t(`flag.${s.flag}.title`)), h('p', {}, t(`flag.${s.flag}.text`)));
      upd();
    } }, s.text);
    return b;
  }));
  upd();
  return h('div', { class: 'phone', role: 'group', 'aria-label': t('hero.demoLabel') },
    h('div', { class: 'phone-top' }, h('span', { class: 'phone-sender' }, icon('smartphone'), 'YourBank'), h('span', { class: 'phone-sub' }, 'SMS')),
    h('div', { class: 'sms' }, bubble),
    h('div', { class: 'flag-progress' }, dots, count),
    detail, done);
}
