// Loads and caches the JSON content files. Pages call these and handle failures with an error state.
import { fetchJSON } from '../util/net.js';
const cache = new Map();
/** Cached JSON loader. Failures are not cached, so "Try again" really retries. Each request has a timeout. */
function load(path) {
  if (!cache.has(path)) cache.set(path, fetchJSON(path).catch((e) => { cache.delete(path); throw e; }));
  return cache.get(path);
}
export const getConfig = () => load('data/content/config.json');
export const getTopics = () => load('data/content/topics.json');
export const getQuestions = () => load('data/content/questions.json');
export const getArticles = () => load('data/content/articles.json');
export const getTips = () => load('data/content/tips.json');
export const getVideos = () => load('data/content/videos.json');
export const getTeam = () => load('data/content/team.json');
export const getKB = () => load('data/chatbot/knowledge-base.json');
export const getKBExtra = () => load('data/chatbot/kb-extra.json');
export const getFAQ = (lang) => load(`data/chatbot/faq.${lang}.json`);
