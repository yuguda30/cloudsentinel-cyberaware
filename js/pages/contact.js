import { h, icon } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { getConfig } from '../core/data.js';
import { breadcrumb } from '../ui/layout.js';
import { newsletterForm } from '../ui/newsletter.js';
import { href } from '../core/router.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export default async function contact() {
  let cfg = {}; try { cfg = await getConfig(); } catch { /* defaults */ }
  const mail = cfg.contactEmail || '';
  const msg = h('p', { class: 'form-msg', role: 'status', 'aria-live': 'polite' });
  const f = (id, label, el, hint) => h('div', { class: 'field' }, h('label', { for: id, class: 'label' }, label), el, hint ? h('p', { class: 'form-hint' }, hint) : null);
  const name = h('input', { id: 'c-name', class: 'input', type: 'text', maxlength: 80, autocomplete: 'name' });
  const email = h('input', { id: 'c-email', class: 'input', type: 'email', maxlength: 120, autocomplete: 'email' });
  const text = h('textarea', { id: 'c-msg', class: 'input', rows: 6, maxlength: 2000 });
  const form = h('form', { class: 'panel', novalidate: true, onSubmit: (e) => {
    e.preventDefault(); msg.className = 'form-msg';
    const err = !name.value.trim() ? [name, 'contact.errName'] : !EMAIL_RE.test(email.value.trim()) ? [email, 'contact.errEmail'] : text.value.trim().length < 10 ? [text, 'contact.errMessage'] : null;
    if (err) { msg.textContent = t(err[1]); msg.classList.add('is-error'); err[0].focus(); return; }
    // No server is involved: this opens the visitor's own email app with the message prepared.
    const body = `${text.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`;
    location.href = `mailto:${mail}?subject=${encodeURIComponent('CyberAware message from ' + name.value.trim())}&body=${encodeURIComponent(body)}`;
    msg.textContent = t('contact.opened'); msg.classList.add('is-ok');
  } }, h('h2', { class: 'h3' }, t('contact.formTitle')), f('c-name', t('contact.name'), name), f('c-email', t('contact.email'), email), f('c-msg', t('contact.message'), text, t('contact.mailtoNote')), msg, h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-primary', type: 'submit' }, icon('mail'), t('contact.send'))));
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.contact') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('contact.title')), h('p', { class: 'lead' }, t('contact.lead'))),
    h('div', { class: 'two-col' }, form, h('div', {}, mail ? h('section', { class: 'panel', 'aria-labelledby': 'ce-h' }, h('h2', { id: 'ce-h', class: 'h3' }, t('contact.direct')), h('p', {}, h('a', { href: `mailto:${mail}`, class: 'big-link' }, icon('mail'), mail))) : null, h('div', { class: 'spaced' }, await newsletterForm()), h('p', { class: 'notice' }, icon('siren'), t('contact.notIncident')))));
  return { title: t('nav.contact'), description: t('contact.lead'), el };
}
