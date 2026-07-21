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

  // On load: saved preference, or dark by default.
  var saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (next === 'dark' ? 'light' : 'dark') + ' mode');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    } else {
      console.error('Theme toggle button not found in the DOM');
    }
  });
})();
