// Videos can exist in several languages. data/content/videos.json lists one entry per video with a "variants"
// object keyed by language code; this module picks the right variant for the visitor.
import { isYouTubeId } from '../util/format.js';

const isReal = (v) => v && !v.placeholder && isYouTubeId(v.youtubeId);

/** Resolve a video for display. `lang` is the preferred language; falls back to English, then any variant. */
export function resolveVideo(video, lang, force) {
  const variants = video.variants || {};
  const codes = Object.keys(variants);
  const pick = force && variants[force] ? force : variants[lang] ? lang : variants.en ? 'en' : codes[0];
  const v = variants[pick] || {};
  return {
    ...video, lang: pick, youtubeId: v.youtubeId, title: v.title || '', description: v.description || '', placeholder: !isReal(v),
    exact: pick === lang,                                       // false when showing a fallback language
    available: codes,                                           // languages this video exists in
    playable: codes.filter((c) => isReal(variants[c])),         // languages with a real, playable video
  };
}
export const hasLanguage = (video, code) => !!(video.variants && video.variants[code]);
export const anyPlayable = (video) => Object.values(video.variants || {}).some(isReal);
