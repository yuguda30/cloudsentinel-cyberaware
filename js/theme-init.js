// Runs synchronously in <head> (external file so the CSP can stay strict) to set the theme
// before first paint and avoid a flash of the wrong theme.
(function () {
  var mode = 'system';
  try { var s = JSON.parse(localStorage.getItem('cs-theme')); if (s === 'light' || s === 'dark' || s === 'system') mode = s; } catch (e) {}
  var dark = mode === 'dark' || (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var r = document.documentElement;
  r.setAttribute('data-theme', dark ? 'dark' : 'light');
  r.setAttribute('data-theme-mode', mode);
  try { var l = JSON.parse(localStorage.getItem('cs-lang')); if (/^(en|ha|ig|yo)$/.test(l)) r.lang = l; } catch (e) {}
})();
