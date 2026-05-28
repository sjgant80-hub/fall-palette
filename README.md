# fall-palette

◊·κ Ctrl+K command palette · drop-in plugin · zero dependencies

A sovereign, single-file JavaScript plugin that adds a Linear / VSCode-style command palette to any web page. Auto-discovers nav buttons and clickable actions in the host tool, fuzzy-searches them, and lets you fire them with two keystrokes.

**Live demo + docs:** https://sjgant80-hub.github.io/fall-palette/

## Install · one line

```html
<script src="https://sjgant80-hub.github.io/fall-palette/fall-palette.js" defer></script>
```

Drop that anywhere before `</body>`. Ctrl+K opens the palette on next page load. No build step, no npm, no framework.

If you want full sovereignty (no CDN call), download `fall-palette.js` and host it yourself.

## What it does

- **Auto-discovers** every `button[id^="nav-"]`, `.nav-item`, `[data-nav]`, and `button[onclick]` in the page and exposes them as palette commands
- **Fuzzy search** — subsequence match, exact-substring boost, relevance-sorted
- **Keyboard-native** — Ctrl+K to open (⌘K on Mac), ↑↓ to navigate, Enter to fire, Esc to close, Tab to cycle
- **Programmable** — register custom commands with `window.fallPalette.register({label, run})`
- **Estate-aware** — detects `window.bloom`, `window.apexSync`, etc. if loaded, and surfaces their actions

## Register a custom command

```js
window.fallPalette.register({
  id:       'sweep:135',                          // unique key
  label:    'Sweep BTC to primed wallet',         // shown in palette
  group:    'Sweep',                              // category column
  keywords: 'broadcast tx send bitcoin',          // extra search match (not shown)
  run:      () => window.fastSweep(privKey)       // executed on Enter
});
```

## API

```js
window.fallPalette.open()             // open programmatically
window.fallPalette.close()
window.fallPalette.register(cmd)      // {id?, label, group?, keywords?, run}
window.fallPalette.discover()         // return current command list (debug)
```

## Hotkeys

| Key | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open palette (or close if already open) |
| `↑` `↓` | Navigate results |
| `Tab` / `Shift+Tab` | Cycle results |
| `Enter` | Fire selected command |
| `Esc` | Close palette |

## Filter behaviour

Type any query — the palette scores each command by:

1. **Exact substring match** in label / group / keywords → high score, position-weighted
2. **Subsequence match** → lower score (e.g. `opfq` matches "Open RFQs")

Top 60 matches are shown, sorted by score.

## Use cases

Best fit when the host tool has substantial navigation + many actions:

- CRM / procurement dashboards (FallForce, Apex)
- Multi-page workflows (GymOS, FallOffice)
- Tools with sync / export / dev actions (Oracle, CASSIE)

Marginal value on single-screen or landing pages — the user already sees all the actions.

## Architecture

Single file, ~11KB minified, vanilla JS, no dependencies. The plugin is an IIFE that:

1. Defines `discover()` — walks the DOM, builds the command list
2. Defines `score()` — fuzzy match scorer
3. Lazy-builds the overlay DOM on first open
4. Binds the global Ctrl+K / ⌘K keydown listener
5. Exposes `window.fallPalette = { open, close, register, discover }`

It re-discovers commands on every open, so dynamic UIs are handled — any button added after page load shows up next time you press Ctrl+K.

## Tested in

- FallForce CRM / Apex Procurement
- OracleEngine v2
- CASSIE TORUS v2

Drop-in compatible with any HTML page that has `<button>` elements. No requirements on the host framework (or no framework).

## Licence

MIT. Part of the Fall sovereign tool estate. ◊·κ=1
