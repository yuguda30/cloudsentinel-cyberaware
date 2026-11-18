import { h, icon } from '../util/dom.js';
import { t, getLanguage, languageName } from '../core/i18n.js';
import { breadcrumb } from '../ui/layout.js';
import { href } from '../core/router.js';
import { translationNotice } from './states.js';

const DOCS = {
  privacy: { updated: '2026-11-12', sections: [
    ['Summary', ['CloudSentinel CyberAware is a free educational website. It has no user accounts, no login, no advertising and no analytics or tracking scripts.']],
    ['What stays on your device', ['The site stores a few preferences in your browser’s local storage so it works the way you left it: your chosen language and theme, articles you bookmark, and your best quiz score. These never leave your device and you can clear them by clearing your browser data for this site.', 'Quiz answers are checked in your browser and are not sent anywhere.']],
    ['What we collect', ['We do not collect personal information through the website. If you email us, or use the contact form (which only opens your own email app), we receive what you choose to send and will use it only to reply.', 'The newsletter form is a preview until a subscription provider is connected. If one is connected, your email address will be sent to that provider to deliver the newsletter, and you can unsubscribe at any time.']],
    ['Videos and external links', ['Videos are embedded from YouTube using the privacy-enhanced domain (youtube-nocookie.com) and only load after you choose to play one. Once a video loads, YouTube’s own privacy policy applies. Links to other websites open in a new tab and we are not responsible for their content.']],
    ['Hosting', ['The site is hosted on GitHub Pages. Like any web host, GitHub may process technical data such as IP addresses to serve the site. See GitHub’s privacy statement for details.']],
    ['Your rights', ['Because we do not hold personal data about website visitors, there is usually nothing to access or delete. If you have emailed us and want your message deleted, contact us and we will do so. Nigerian data protection law, including the Nigeria Data Protection Act 2023, may give you additional rights.']],
    ['Changes and contact', ['We may update this policy and will change the date above. Questions? Use the Contact page.']]] },
  terms: { updated: '2026-11-12', sections: [
    ['Purpose', ['CloudSentinel CyberAware provides general cybersecurity awareness and digital safety education. By using the site you agree to these terms.']],
    ['Not professional advice', ['The content is for education only. It is not legal, financial or professional security advice and it cannot replace help from your bank, your service provider or a qualified professional. The chatbot is a knowledge-base assistant, not an incident-response service. If you are a victim of fraud or an attack, contact your bank, the affected service and the relevant authorities immediately.']],
    ['Accuracy', ['We work to keep content accurate and up to date, but threats change quickly and we cannot guarantee that everything is complete or current. Some content is available in English only; translations into Hausa, Igbo and Yorùbá are being added and should be reviewed by native speakers.']],
    ['Acceptable use', ['Do not misuse the site, attempt to disrupt it or use its content to harm others.']],
    ['Intellectual property', ['The site’s original content and branding belong to CloudSentinel Technologies unless stated otherwise. You may share links and short excerpts with credit. Third-party content, such as embedded videos, belongs to its owners.']],
    ['Limitation of liability', ['The site is provided as is, without warranties. To the extent permitted by law, CloudSentinel Technologies is not liable for losses arising from use of the site or reliance on its content.']],
    ['Changes', ['We may update these terms from time to time. Continued use of the site means you accept the updated terms.']]] },
};
export default async function legal({ path }) {
  const key = path.startsWith('/terms') ? 'terms' : 'privacy'; const d = DOCS[key];
  const el = h('div', { class: 'container section page-head-wrap' }, breadcrumb([{ label: t('nav.home'), href: href('/') }, { label: t('nav.' + key) }]),
    h('article', { class: 'legal prose' }, h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('nav.' + key)), h('p', { class: 'muted' }, t('legal.updated', { date: d.updated }))),
      getLanguage() !== 'en' ? translationNotice(getLanguage(), languageName(getLanguage())) : null,
      h('p', { class: 'notice', role: 'note' }, icon('info'), t('legal.draft')),
      d.sections.map(([title, ps], i) => h('section', {}, h('h2', { class: 'h3' }, title), ps.map((p) => h('p', {}, p))))));
  return { title: t('nav.' + key), el };
}
