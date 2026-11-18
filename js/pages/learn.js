import { setKids } from '../util/dom.js';
import { h, icon, norm } from '../util/dom.js';
import { t, localizeAll } from '../core/i18n.js';
import { getTopics } from '../core/data.js';
import { topicCard } from '../ui/cards.js';
import { breadcrumb } from '../ui/layout.js';
import { href } from '../core/router.js';
import { emptyState, errorState } from './states.js';

const GROUPS = [['foundations', ['intro', 'passwords', 'phishing', 'social-engineering', 'scams']], ['devices', ['mobile', 'browsing', 'wifi', 'network', 'malware']], ['accounts', ['social-media', 'privacy', 'identity-theft', 'payments', 'ai']], ['community', ['students', 'business', 'organisations']]];

export default async function learn() {
  let topics;
  try { topics = localizeAll('topics', await getTopics()); } catch { return { title: t('nav.learn'), el: h('div', { class: 'container section' }, errorState(() => location.reload())) }; }
  const out = h('div', {});
  const input = h('input', { id: 'topic-filter', type: 'search', class: 'input', placeholder: t('learn.filterPlaceholder'), autocomplete: 'off' });
  const draw = () => {
    const q = norm(input.value);
    setKids(out, );
    let shown = 0;
    for (const [g, ids] of GROUPS) {
      const list = ids.map((id) => topics.find((x) => x.id === id)).filter((tp) => tp && (!q || norm(tp.title + ' ' + tp.summary).includes(q)));
      if (!list.length) continue;
      shown += list.length;
      out.append(h('section', { 'aria-labelledby': 'g-' + g, class: 'group' }, h('h2', { id: 'g-' + g, class: 'h3 group-title' }, t('learn.group.' + g)), h('div', { class: 'grid grid-3' }, list.map((tp) => topicCard(tp)))));
    }
    if (!shown) out.append(emptyState({ title: t('ui.noResults'), text: t('learn.noMatch') }));
  };
  input.addEventListener('input', draw); draw();
  const el = h('div', { class: 'container section page-head-wrap' },
    breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.learn') }]),
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('learn.title')), h('p', { class: 'lead' }, t('learn.lead', { n: topics.length }))),
    h('div', { class: 'filter-row' }, h('label', { for: 'topic-filter', class: 'sr-only' }, t('learn.filterLabel')), input),
    out);
  return { title: t('nav.learn'), description: t('learn.lead', { n: topics.length }), el };
}
