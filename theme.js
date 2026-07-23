// theme.js — adapted from the product's theme-toggle.ts.
// Same mechanism (data-theme attribute + localStorage), no React/MUI
// dependency, so it works standalone here. One change from the
// original: default is "dark", not "light" — matches portal.joinmaie.com
// and waitlist.joinmaie.com, which are both dark-first. The app's own
// default of "light" was a separate, app-specific call; it doesn't
// apply to this marketing site's brand presentation.

(function () {
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // aria-label describes what clicking the button WILL do (switch TO the
  // other theme), not the current state — so it's the opposite of `theme`.
  function setToggleLabel(btn, theme) {
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  }

  // localStorage.getItem/setItem can throw in storage-blocked contexts
  // (e.g. Safari "Block All Cookies", some private-browsing/enterprise
  // configs) — guarded so the toggle degrades to the default theme instead
  // of the whole script failing to initialize (found in the pre-production
  // audit: an unguarded throw here aborted this IIFE before the click
  // listener below was ever registered, breaking the toggle entirely).
  function readSavedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function writeSavedTheme(theme) {
    try { localStorage.setItem('theme', theme); } catch (e) { /* no-op — persistence just doesn't happen */ }
  }

  // On load: saved preference, or dark by default. The toggle's aria-label
  // is synced here too — previously it was only updated inside
  // toggleTheme(), so a returning visitor with a saved "light" preference
  // got a button whose accessible name still said "Switch to light mode"
  // even though the page had already loaded in light mode (found in the
  // pre-production audit).
  var saved = readSavedTheme() || 'dark';
  applyTheme(saved);

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeSavedTheme(next);
    setToggleLabel(document.getElementById('theme-toggle'), next);
    // Canvas-rendered elements (Pixie companion) can't react to a CSS custom
    // property change on their own — nothing repaints a canvas automatically.
    // This lets any such listener re-read the new theme colors and update
    // live, instead of only picking up the change on next init.
    document.dispatchEvent(new CustomEvent('maie:themechange', { detail: { theme: next } }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      setToggleLabel(btn, saved);
      btn.addEventListener('click', toggleTheme);
    } else {
      console.error('Theme toggle button not found in the DOM');
    }
  });
})();
