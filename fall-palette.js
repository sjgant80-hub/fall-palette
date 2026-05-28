// ◊·κ FALL-PALETTE · v1.0 · 2026-05-28
// Ctrl+K command palette · drop-in plugin · zero dependencies
// Auto-discovers nav buttons + actions in any Fall* sovereign tool.
//
// USAGE (CDN):
//   <script src="https://sjgant80-hub.github.io/fall-palette/fall-palette.js" defer></script>
// USAGE (local):
//   download fall-palette.js · include as <script src="./fall-palette.js"></script>
//
// HOTKEY: Ctrl+K (Windows/Linux) · ⌘K (Mac) · Esc to close · Enter to fire · ↑↓ to navigate
//
// REGISTER CUSTOM COMMANDS:
//   window.fallPalette.register({
//     id:       'sweep:135',                              // unique
//     label:    'Sweep BTC to primed wallet',             // shown in palette
//     group:    'Sweep',                                  // category column
//     keywords: 'broadcast tx send bitcoin',              // extra search match
//     run:      () => window.fastSweep(privKey)           // executed on Enter
//   });
//
// PROGRAMMATIC OPEN/CLOSE:
//   window.fallPalette.open();
//   window.fallPalette.close();
//
// MIT licence · part of the Fall* sovereign tool estate

(function fallPalette(){
  if (window.fallPalette && window.fallPalette._v >= 1) return;

  function discover() {
    var commands = [];
    var seen = {};
    function add(c) {
      var key = c.id || c.label;
      if (seen[key]) return;
      seen[key] = 1;
      commands.push(c);
    }
    // 1. Nav buttons · [id^="nav-"] · onclick="showPage('X')"
    document.querySelectorAll('button[id^="nav-"], button.nav-item, a.nav-item, [data-nav]').forEach(function(el){
      var txt = (el.querySelector('.nav-text') || el).innerText.trim().split('\n')[0];
      if (!txt) return;
      var onclick = el.getAttribute('onclick') || '';
      var dataNav = el.getAttribute('data-nav');
      var run;
      if (dataNav && typeof window.showPage === 'function') run = function(){ window.showPage(dataNav); };
      else if (onclick) run = function(){ try { (new Function(onclick))(); } catch(e) { console.warn('palette nav fire:', e); } };
      else run = function(){ el.click(); };
      add({ id: 'nav:' + (el.id || txt), label: txt, group: 'Navigate', run: run, keywords: 'go to page section' });
    });
    // 2. Buttons with onclick · skip nav (already handled) and dev/debug
    document.querySelectorAll('button[onclick]').forEach(function(el){
      if (el.id && el.id.indexOf('nav-') === 0) return;
      var txt = el.innerText.trim().split('\n')[0];
      if (!txt || txt.length > 60) return;
      var oc = el.getAttribute('onclick');
      if (!oc) return;
      if (/^(close|cancel|×|dismiss)$/i.test(txt)) return;
      add({ id: 'action:' + (el.id || txt + ':' + oc.slice(0,20)), label: txt, group: 'Action', run: function(){ try { (new Function(oc))(); } catch(e) { el.click(); } }, keywords: oc });
    });
    // 3. Tool-registered commands
    if (window.fallPalette && window.fallPalette._userCommands) {
      window.fallPalette._userCommands.forEach(add);
    }
    // 4. Estate built-ins (only if the host tool has the relevant API)
    add({ id: 'sys:reload', label: 'Reload page', group: 'System', run: function(){ location.reload(); }, keywords: 'refresh' });
    add({ id: 'sys:devtools', label: 'Toggle dev mode (show KCC + bloom)', group: 'System',
      run: function(){
        document.body.classList.toggle('dev-mode');
        try { localStorage.setItem('apex_dev_mode', document.body.classList.contains('dev-mode') ? '1' : '0'); } catch(_){}
      }, keywords: 'developer debug kcc bloom' });
    if (window.bloom && window.bloom.decompose) {
      add({ id: 'sys:bloom-input', label: 'Decompose text (bloom signature)', group: 'Bloom',
        run: function(){
          var t = prompt('Text to decompose into 7-ring vector:'); if (!t) return;
          var r = window.bloom.decompose(t);
          alert('Bloom · ' + r.dominantLabel + '\n' + r.bloom.map(function(c,i){return 'R'+i+': '+c;}).join('\n') + '\nProduct = ' + r.product.toString());
        }, keywords: 'ring decompose vector' });
    }
    if (window.apexSync) {
      add({ id: 'sync:export', label: 'Export all data (JSON)',   group: 'Sync', run: function(){ window.apexSync.exportAll(); }, keywords: 'download backup save' });
      add({ id: 'sync:import', label: 'Import data (JSON file)',  group: 'Sync', run: function(){ window.apexSync.importFromFile(); }, keywords: 'upload restore load' });
      add({ id: 'sync:endpoint', label: 'Configure sync endpoint', group: 'Sync', run: function(){ window.apexSync.configureEndpoint(); }, keywords: 'server url team' });
    }
    return commands;
  }

  function score(item, q) {
    if (!q) return 1;
    q = q.toLowerCase();
    var hay = (item.label + ' ' + (item.group||'') + ' ' + (item.keywords||'')).toLowerCase();
    var idx = hay.indexOf(q);
    if (idx >= 0) return 100 - idx;
    var hi = 0, qi = 0;
    while (hi < hay.length && qi < q.length) {
      if (hay[hi] === q[qi]) qi++;
      hi++;
    }
    if (qi === q.length) return 30;
    return 0;
  }

  var overlay = null, input = null, listEl = null, items = [], filtered = [], cursor = 0;

  function build() {
    overlay = document.createElement('div');
    overlay.id = 'fall-palette-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding-top:14vh;font-family:system-ui,-apple-system,sans-serif';
    overlay.innerHTML =
      '<div id="fall-palette-box" style="background:#161821;border:1px solid #2a2f3a;border-radius:10px;width:min(640px,90vw);max-height:62vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.6)">' +
        '<div style="padding:14px 16px;border-bottom:1px solid #2a2f3a;display:flex;align-items:center;gap:10px">' +
          '<span style="font-family:DM Mono,monospace;color:#d4af37;font-size:13px">◊</span>' +
          '<input id="fall-palette-input" type="text" placeholder="Go to page or run action..." autocomplete="off" style="flex:1;background:transparent;color:#e6e8ee;border:none;outline:none;font-size:15px;font-family:inherit"/>' +
          '<span style="font-family:DM Mono,monospace;color:#5a5a5a;font-size:10px">esc</span>' +
        '</div>' +
        '<div id="fall-palette-list" style="overflow-y:auto;flex:1;padding:6px"></div>' +
        '<div style="padding:8px 14px;border-top:1px solid #2a2f3a;display:flex;justify-content:space-between;font-family:DM Mono,monospace;color:#5a5a5a;font-size:10px">' +
          '<span>up/down navigate · enter to fire · esc to close</span>' +
          '<span id="fall-palette-count">0</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    input = document.getElementById('fall-palette-input');
    listEl = document.getElementById('fall-palette-list');
    input.addEventListener('input', filter);
    input.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
  }

  function open() {
    if (!overlay) build();
    items = discover();
    overlay.style.display = 'flex';
    input.value = ''; cursor = 0;
    filter();
    setTimeout(function(){ input.focus(); }, 10);
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
  }

  function filter() {
    var q = input.value;
    filtered = items.map(function(it){ return { it: it, s: score(it, q) }; })
                    .filter(function(x){ return x.s > 0; })
                    .sort(function(a,b){ return b.s - a.s; })
                    .slice(0, 60)
                    .map(function(x){ return x.it; });
    cursor = 0;
    render();
  }

  function render() {
    if (!filtered.length) {
      listEl.innerHTML = '<div style="padding:18px;text-align:center;color:#5a5a5a;font-size:13px">No matches.</div>';
      document.getElementById('fall-palette-count').textContent = '0';
      return;
    }
    listEl.innerHTML = filtered.map(function(it, i){
      var sel = i === cursor;
      var bg = sel ? 'background:rgba(212,175,55,0.12);border-left:3px solid #d4af37' : 'border-left:3px solid transparent';
      return '<div data-i="' + i + '" class="fall-palette-row" style="padding:8px 12px;cursor:pointer;border-radius:5px;display:flex;justify-content:space-between;gap:12px;color:#dbe1ea;font-size:13px;' + bg + '">' +
        '<span>' + escHtml(it.label) + '</span>' +
        '<span style="font-family:DM Mono,monospace;color:#5a5a5a;font-size:10px;text-transform:uppercase;letter-spacing:0.08em">' + escHtml(it.group || '') + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('fall-palette-count').textContent = filtered.length + ' / ' + items.length;
    listEl.querySelectorAll('.fall-palette-row').forEach(function(row){
      row.addEventListener('click', function(){ var i = +row.getAttribute('data-i'); cursor = i; fire(); });
      row.addEventListener('mouseenter', function(){ var i = +row.getAttribute('data-i'); if (i !== cursor) { cursor = i; render(); } });
    });
    var selEl = listEl.querySelector('[data-i="' + cursor + '"]');
    if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
  }

  function fire() {
    var it = filtered[cursor];
    if (!it) return;
    close();
    try { it.run(); } catch(e) { console.warn('palette run:', e); }
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); e.preventDefault(); return; }
    if (e.key === 'Enter')  { fire(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { if (cursor < filtered.length - 1) { cursor++; render(); } e.preventDefault(); return; }
    if (e.key === 'ArrowUp')   { if (cursor > 0) { cursor--; render(); } e.preventDefault(); return; }
    if (e.key === 'Tab')       { cursor = (cursor + (e.shiftKey ? -1 : 1) + filtered.length) % filtered.length; render(); e.preventDefault(); return; }
  }

  function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; });
  }

  // Global hotkey
  document.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (overlay && overlay.style.display === 'flex') close(); else open();
    }
  });

  // Public API
  window.fallPalette = {
    _v: 1,
    _userCommands: [],
    open: open,
    close: close,
    register: function(cmd) {
      if (!cmd || !cmd.label || typeof cmd.run !== 'function') return;
      this._userCommands.push(cmd);
    },
    discover: discover
  };

  try { console.log('%cfall-palette', 'color:#d4af37;font-weight:bold', 'v1 · Ctrl+K to open · window.fallPalette.register({label, run})'); } catch(_){}
})();
