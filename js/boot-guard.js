/* Start-up guard. A plain (non-module) script, so it still runs when the application's ES modules fail to
   load or parse. Its job: a visitor must never be left staring at the loading logo.
   It shows a clear error screen (with a reference code, retry, hard-reset and file diagnostics) when:
   - the page is opened from file:// (browsers block ES modules there)
   - the app's script fails to load or parse (missing file, old browser, blocked request)
   - the app has not finished starting within BOOT_TIMEOUT
   - the app reports a fatal start-up error through window.__csFail()
   It also handles ?reset=1 (unregister service workers, clear caches, reload). */
(function () {
  'use strict';
  var BOOT_TIMEOUT = 12000, SLOW_NOTE = 5000;
  var errors = [], ready = false, shown = false, timer, versionInfo = '';
  var CRITICAL = ['index.html', 'css/tokens.css', 'css/base.css', 'css/layout.css', 'css/components.css', 'css/pages.css',
    'js/app.js', 'js/util/dom.js', 'js/util/net.js', 'js/util/storage.js', 'js/util/format.js', 'js/core/i18n.js', 'js/core/theme.js', 'js/core/router.js',
    'js/core/data.js', 'js/core/pwa.js', 'js/ui/layout.js', 'js/ui/motion.js', 'js/pages/home.js', 'js/pages/states.js',
    'data/i18n/en.json', 'data/content/config.json', 'data/content/topics.json', 'assets/icons/sprite.svg'];

  function note(msg) {
    msg = String(msg == null ? '' : msg).replace(/\s+/g, ' ').slice(0, 280);
    if (msg && errors.indexOf(msg) < 0 && errors.length < 14) errors.push(msg);
  }
  function short(url) { return String(url || '').split('/').slice(-3).join('/'); }

  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) {            // a resource failed to load
      note('Failed to load ' + short(t.src || t.href));
      if (t.tagName === 'SCRIPT' && t.type === 'module') showFallback('module');
    } else {
      note((e.message || 'Script error') + (e.filename ? ' (' + short(e.filename) + ':' + e.lineno + ')' : ''));
      // A syntax/linking error in one of our own modules means the app can never start (corrupted file, very old browser).
      if (!ready && e.filename && e.filename.indexOf(location.origin) === 0 && /SyntaxError|does not provide an export|Unexpected token|Cannot use import/i.test(e.message || '')) showFallback('module');
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) { note('Unhandled: ' + (e.reason && (e.reason.message || e.reason))); });
  window.__csNote = note;
  window.__csFail = function (err) { note(err && (err.message || err)); showFallback('startup'); };
  window.__csDone = function () {
    ready = true; clearTimeout(timer); clearTimeout(slowTimer);
    var b = document.getElementById('boot');
    if (b) { b.classList.add('is-done'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 400); }
  };

  function hardReset() {
    var jobs = [];
    try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })); } catch (e) {}
    try { if (window.caches && caches.keys) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (e) {}
    return Promise.all(jobs).catch(function () {}).then(function () {
      var u = new URL(location.href); u.searchParams.delete('reset'); u.searchParams.set('r', Date.now().toString(36)); location.replace(u.href);
    });
  }
  window.__csHardReset = hardReset;
  if (/[?&]reset=1\b/.test(location.search)) { hardReset(); return; }

  function ref() {
    var h = 0, s = errors.join('|');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'CS-' + Date.now().toString(36).toUpperCase().slice(-5) + '-' + h.toString(36).toUpperCase().slice(0, 4);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function diagnose(box) {
    var bad = [], pending = CRITICAL.length;
    if (!window.fetch) { box.textContent = ''; return; }
    CRITICAL.forEach(function (p) {
      fetch(p, { cache: 'no-store' }).then(function (r) { if (!r.ok) bad.push(p + ' (HTTP ' + r.status + ')'); }, function () { bad.push(p + ' (unreachable)'); })
        .then(function () {
          if (--pending) return;
          box.textContent = bad.length ? 'Missing or unreachable files: ' + bad.join(', ') + '. The upload is probably incomplete (GitHub’s web uploader accepts at most 100 files per commit), or the site was opened from the wrong folder.'
            : 'All core files are reachable, so this looks like a browser compatibility problem or a script error (see details).';
        });
    });
    fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) { versionInfo = 'Build ' + v.version; }, function () {});
  }

  function showFallback(reason) {
    if (shown || ready) return; shown = true; clearTimeout(timer);
    var boot = document.getElementById('boot');
    if (!boot) { boot = el('div'); boot.id = 'boot'; document.body.appendChild(boot); }
    boot.className = 'boot-error-host'; boot.removeAttribute('aria-label'); boot.setAttribute('role', 'alert');
    boot.textContent = '';
    var file = location.protocol === 'file:';
    var card = el('div', 'boot-error');
    // inline styles via CSSOM keep this screen readable even if the stylesheets themselves failed to load
    boot.style.position = 'fixed'; boot.style.inset = '0'; boot.style.overflow = 'auto'; boot.style.background = '#08305C'; boot.style.color = '#fff'; boot.style.zIndex = '500'; boot.style.padding = '24px'; boot.style.opacity = '1'; boot.style.fontFamily = 'system-ui, sans-serif';
    card.style.maxWidth = '640px'; card.style.margin = '0 auto'; card.style.lineHeight = '1.5';
    var logo = el('img'); logo.src = 'assets/img/logo.png'; logo.alt = ''; logo.width = 64; logo.height = 64; logo.style.animation = 'none'; card.appendChild(logo);
    card.appendChild(el('h1', 'boot-error-title', file ? 'Open this site from a web address' : 'The page could not load'));
    card.lastChild.style.fontSize = '1.6rem'; card.lastChild.style.margin = '12px 0 8px';
    var msg = el('p', '', file
      ? 'You opened CloudSentinel CyberAware directly from a file on your computer (file://). Browsers block the scripts it needs in that case. Use the published GitHub Pages address, or start a local server (for example “node scripts/serve.mjs” or “python3 -m http.server”) and open http://localhost:8080/.'
      : reason === 'unsupported' ? 'Your browser is too old to run this website. Please update it, or try a current version of Chrome, Edge, Firefox or Safari.'
        : 'CloudSentinel CyberAware didn’t finish starting. This is usually a poor connection, an out-of-date saved copy, or missing files. Your progress and settings are safe.');
    card.appendChild(msg);
    var row = el('p'); row.style.display = 'flex'; row.style.flexWrap = 'wrap'; row.style.gap = '10px';
    function btn(label, fn, primary) { var b = el('button', 'btn ' + (primary ? 'btn-gold' : 'btn-outline-light'), label); b.type = 'button'; b.style.padding = '12px 20px'; b.style.minHeight = '46px'; b.style.borderRadius = '999px'; b.style.border = primary ? '0' : '2px solid #fff'; b.style.background = primary ? '#E3A92A' : 'transparent'; b.style.color = primary ? '#2B1D00' : '#fff'; b.style.fontWeight = '700'; b.style.fontSize = '1rem'; b.style.cursor = 'pointer'; b.addEventListener('click', fn); row.appendChild(b); return b; }
    if (!file) { btn('Retry', function () { location.reload(); }, true); btn('Reload Website', function () { this.disabled = true; this.textContent = 'Resetting…'; hardReset(); }, false); }
    else btn('Retry', function () { location.reload(); }, true);
    card.appendChild(row);
    var diag = el('p', 'boot-error-diag', file ? '' : 'Checking files…'); diag.style.fontSize = '.95rem'; diag.style.opacity = '.9'; card.appendChild(diag);
    var code = ref();
    var det = el('details'); det.style.marginTop = '12px'; det.appendChild(el('summary', '', 'Error reference: ' + code));
    var pre = el('pre'); pre.style.whiteSpace = 'pre-wrap'; pre.style.fontSize = '.8rem'; pre.style.background = 'rgba(255,255,255,.08)'; pre.style.padding = '10px'; pre.style.borderRadius = '8px';
    pre.textContent = ['Reference: ' + code, 'Reason: ' + reason, 'Address: ' + location.href, 'Online: ' + (navigator.onLine), 'Service worker controlling: ' + !!(navigator.serviceWorker && navigator.serviceWorker.controller), 'Browser: ' + navigator.userAgent, ''].concat(errors.length ? errors : ['(no script errors were captured)']).join('\n');
    det.appendChild(pre); card.appendChild(det);
    boot.appendChild(card);
    if (!file) diagnose(diag);
    setTimeout(function () { if (versionInfo) pre.textContent += '\n' + versionInfo; }, 1500);
  }
  window.__csShowFallback = showFallback;

  if (location.protocol === 'file:') { document.addEventListener('DOMContentLoaded', function () { showFallback('file'); }); return; }
  if (!('noModule' in HTMLScriptElement.prototype)) { document.addEventListener('DOMContentLoaded', function () { showFallback('unsupported'); }); return; }
  var slowTimer = setTimeout(function () { var n = document.getElementById('boot-note'); if (n && !ready) { n.hidden = false; n.textContent = 'Still loading… this can take a moment on a slow connection.'; } }, SLOW_NOTE);
  timer = setTimeout(function () { if (!ready) { note('Start-up did not finish within ' + BOOT_TIMEOUT / 1000 + 's'); showFallback('timeout'); } }, BOOT_TIMEOUT);
})();
