// Knowledge-base chatbot engine (no DOM, no network). Replaces the original "first key that
// contains any word" matching, which returned unrelated answers for common words.
const STOP = new Set(`a an the is are am was were be been to of in on at for and or but if so do does did can could should would will i me my we you your it its this that these those what whats how why when where who which with without about into from by as not no please tell explain mean means meaning define definition give some any there their them they have has had get use using really very just more most`.split(/\s+/));
const SYN = { hacked: 'hack', hacker: 'hack', hackers: 'hack', hacking: 'hack', scammed: 'scam', scams: 'scam', scammer: 'scam', scammers: 'scam', fraudulent: 'fraud', fraudster: 'fraud', passwords: 'password', passcode: 'password', pwd: 'password', pass: 'password', otps: 'otp', pins: 'pin', phished: 'phishing', phish: 'phishing', emails: 'email', mail: 'email', malwares: 'malware', virus: 'malware', viruses: 'malware', trojan: 'malware', ransomwares: 'ransomware', wifi: 'wifi', 'wi-fi': 'wifi', wireless: 'wifi', '2fa': 'twofactor', mfa: 'twofactor', 'two-factor': 'twofactor', backups: 'backup', updates: 'update', updating: 'update', apps: 'app', phones: 'phone', accounts: 'account', cards: 'card', threats: 'threat', attacks: 'attack', secure: 'security', safely: 'safe', safety: 'safe', protect: 'protection', protecting: 'protection', protected: 'protection', privacy: 'privacy', private: 'privacy', vpns: 'vpn', ids: 'id' };

export function normalize(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/2[\s-]?factor|two[\s-]?factor/g, 'twofactor').replace(/wi[\s-]?fi/g, 'wifi')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function tokens(s) {
  return normalize(s).split(' ').filter(Boolean).map((w) => SYN[w] ?? w).map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)).filter((w) => !STOP.has(w));
}

export function buildIndex(entries) {
  const seen = new Map();
  for (const e of entries) {                       // later entries override earlier ones with the same normalised question
    const nq = normalize(e.q); if (!nq || !e.a) continue;
    seen.set(nq, { ...e, nq, toks: new Set(tokens(e.q).concat(tokens((e.keywords || []).join(' ')))) });
  }
  const docs = [...seen.values()];
  const df = new Map();
  for (const d of docs) for (const t of d.toks) df.set(t, (df.get(t) || 0) + 1);
  const idf = (t) => Math.log(1 + docs.length / (1 + (df.get(t) || 0)));
  return { docs, idf, byNorm: seen };
}

export function search(index, query, { limit = 3, threshold = 0.42 } = {}) {
  const nq = normalize(query);
  if (!nq) return { best: null, related: [] };
  const qt = new Set(tokens(query));
  const exact = index.byNorm.get(nq);
  const scored = [];
  for (const d of index.docs) {
    let score = 0;
    if (d === exact) score = 1.01;
    else if (qt.size) {
      let common = 0, qSum = 0, dSum = 0;
      for (const t of qt) qSum += index.idf(t);
      for (const t of d.toks) dSum += index.idf(t);
      for (const t of qt) if (d.toks.has(t)) common += index.idf(t);
      if (common > 0) {
        const qc = common / qSum, dc = common / dSum;
        score = (2 * qc * dc) / (qc + dc);
        if (nq.includes(d.nq) && d.nq.length > 6) score = Math.max(score, 0.85); // user's text contains the whole known question
      }
    }
    if (score > 0) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score || a.d.q.length - b.d.q.length);
  const top = scored[0];
  const best = top && top.score >= threshold ? { q: top.d.q, a: top.d.a, id: top.d.id, score: top.score } : null;
  const related = scored.filter((s) => s !== top && s.score >= 0.25 && !(best && s.d.a === best.a)).slice(0, limit).map((s) => ({ q: s.d.q, score: s.score }));
  return { best, related };
}

/** Words that suggest the person may be in the middle of an incident. */
export const URGENT_RE = /(i (was|got|have been|am being) (scammed|hacked|defrauded|blackmailed)|lost (my )?money|money (was )?(stolen|taken|debited)|someone (stole|took|hacked)|sextortion|blackmail|ransom note|my account (was|got) (hacked|compromised)|unauthori[sz]ed (debit|transaction)|emergency|urgent help)/i;
export const isUrgent = (q) => URGENT_RE.test(String(q));
export const GREETING_RE = /^(hi|hello|hey|good (morning|afternoon|evening)|sannu|nnoo|ndewo|bawo|pẹlẹ o|pele o)\b/i;
