import { h, icon, safeUrl } from '../util/dom.js';
import { t } from '../core/i18n.js';
import { getConfig } from '../core/data.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Real only when config.newsletter.endpoint is set to an https URL of an email provider/form service.
 *  Otherwise the form is shown as a clearly labelled preview that cannot be submitted. */
export async function newsletterForm() {
  let cfg = {}; try { cfg = await getConfig(); } catch { /* preview mode */ }
  const endpoint = cfg.newsletter?.endpoint && safeUrl(cfg.newsletter.endpoint)?.startsWith('https:') ? cfg.newsletter.endpoint : '';
  const msg = h('p', { class: 'form-msg', role: 'status', 'aria-live': 'polite' });
  const input = h('input', { id: 'nl-email', class: 'input', type: 'email', name: cfg.newsletter?.fieldName || 'email', required: true, autocomplete: 'email', maxlength: 120, placeholder: t('newsletter.placeholder'), disabled: !endpoint });
  const btn = h('button', { class: 'btn btn-primary', type: 'submit', disabled: !endpoint }, icon('send'), t('newsletter.subscribe'));
  const form = h('form', { class: 'newsletter', novalidate: true, onSubmit: async (e) => {
    e.preventDefault(); msg.className = 'form-msg';
    const v = input.value.trim();
    if (!EMAIL_RE.test(v)) { msg.textContent = t('newsletter.invalid'); msg.classList.add('is-error'); input.focus(); return; }
    btn.disabled = true;
    try {
      const body = new FormData(); body.append(input.name, v);
      const res = await fetch(endpoint, { method: cfg.newsletter?.method || 'POST', body, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      msg.textContent = t('newsletter.success'); msg.classList.add('is-ok'); input.value = '';
    } catch { msg.textContent = t('newsletter.failed'); msg.classList.add('is-error'); }
    btn.disabled = false;
  } },
    h('label', { for: 'nl-email', class: 'label' }, t('newsletter.label')), h('div', { class: 'inline-form' }, input, btn), msg,
    endpoint ? null : h('p', { class: 'notice', role: 'note' }, icon('info'), t('newsletter.preview')));
  return h('section', { class: 'panel', 'aria-labelledby': 'nl-h' }, h('h2', { id: 'nl-h', class: 'h3' }, t('newsletter.title')), h('p', {}, t('newsletter.text')), form);
}
