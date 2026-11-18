import { setKids } from '../util/dom.js';
import { h, icon, announce } from '../util/dom.js';
import { t, getLanguage, languageName } from '../core/i18n.js';
import { getKB, getKBExtra, getFAQ } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { href } from '../core/router.js';
import { buildIndex, search, isUrgent, GREETING_RE } from '../chat/engine.js';
import { errorState } from './states.js';

const EN_SUGGEST = ['What is phishing?', 'How do I create a strong password?', 'What is SIM swap fraud?', 'Will my bank ask for my OTP or PIN?', 'How do I protect my WhatsApp account?', 'What is ransomware?'];
let enIndex = null;
export default async function chatPage() {
  const lang = getLanguage();
  let faqIndex = null, faq = [];
  try {
    if (!enIndex) { const [kb, extra] = await Promise.all([getKB(), getKBExtra()]); enIndex = buildIndex([...Object.entries(kb).map(([q, a]) => ({ q, a })), ...extra]); }
    if (lang !== 'en') { try { faq = await getFAQ(lang); faqIndex = buildIndex(faq); } catch { /* English only */ } }
  } catch { return { title: t('nav.chat'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }

  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': t('chat.log'), tabindex: '0' });
  const input = h('input', { id: 'chat-in', class: 'input', type: 'text', maxlength: 300, placeholder: t('chat.placeholder'), autocomplete: 'off', enterkeyhint: 'send' });
  const chipsBox = h('div', { class: 'chips suggestions', role: 'group', 'aria-label': t('chat.suggested') });
  const add = (who, ...kids) => { const m = h('div', { class: 'msg ' + who }, h('div', { class: 'bubble' }, ...kids)); log.append(m); log.scrollTop = log.scrollHeight; return m; };
  const chip = (q) => h('button', { type: 'button', class: 'chip-btn', onClick: () => ask(q) }, q);
  const suggestions = lang !== 'en' && faq.length ? faq.slice(0, 6).map((f) => f.q) : EN_SUGGEST;
  chipsBox.append(...suggestions.map(chip));

  function ask(text) {
    text = String(text).trim().slice(0, 300); if (!text) return;
    add('user', text); input.value = '';
    const kids = [];
    if (isUrgent(text)) kids.push(h('p', { class: 'urgent' }, icon('siren'), t('chat.urgent')));
    let res = null, englishFallback = false;
    if (GREETING_RE.test(text) && text.split(/\s+/).length <= 3) { add('bot', h('p', {}, t('chat.hello'))); return; }
    if (faqIndex) res = search(faqIndex, text, { threshold: 0.4 });
    if (!res?.best) { res = search(enIndex, text); englishFallback = lang !== 'en' && !!res.best; }
    if (res.best) {
      kids.push(h('p', {}, res.best.a));
      if (englishFallback) kids.push(h('p', { class: 'card-meta' }, icon('info'), t('chat.englishAnswer', { language: languageName(lang) })));
    } else kids.push(h('p', {}, t('chat.noAnswer')));
    const rel = (res.related || []).slice(0, 3);
    const m = add('bot', ...kids);
    if (rel.length) m.querySelector('.bubble').append(h('div', { class: 'chips related' }, h('span', { class: 'related-label' }, t('chat.alsoAsk')), rel.map((r) => chip(r.q.charAt(0).toUpperCase() + r.q.slice(1) + (r.q.endsWith('?') ? '' : '?')))));
    announce(t('chat.replied'));
  }
  add('bot', h('p', {}, t('chat.welcome')));
  const el = h('div', { class: 'container section page-head-wrap chat-page' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.chat') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('chat.title')), h('p', { class: 'lead' }, t('chat.lead'))),
    h('p', { class: 'notice', role: 'note' }, icon('info'), t('chat.limits')),
    h('div', { class: 'chat panel' }, log, chipsBox,
      h('form', { class: 'chat-form', onSubmit: (e) => { e.preventDefault(); ask(input.value); } }, h('label', { for: 'chat-in', class: 'sr-only' }, t('chat.label')), input, h('button', { class: 'btn btn-primary', type: 'submit' }, icon('send'), h('span', {}, t('chat.send')))),
      h('button', { class: 'linklike chat-clear', type: 'button', onClick: () => { setKids(log, ); add('bot', h('p', {}, t('chat.welcome'))); } }, icon('rotate-ccw'), t('chat.clear'))));
  return { title: t('nav.chat'), description: t('chat.lead'), el };
}
