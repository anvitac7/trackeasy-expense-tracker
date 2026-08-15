/**
 * main.js
 * Shared behavior across every page: dark mode (persisted), mobile nav
 * toggle, and a small toast helper other scripts can reuse.
 * No frameworks, no build step — plain DOM APIs only.
 */

// ---------- Dark mode ----------
// Applied as early as possible (see inline snippet in <head> of each page)
// to avoid a flash of the wrong theme; this just wires up the toggle button.
function initDarkModeToggle() {
  const toggleBtns = document.querySelectorAll('[data-dark-toggle]');
  const root = document.documentElement;

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isDark = root.classList.toggle('dark');
      localStorage.setItem('trackeasy-theme', isDark ? 'dark' : 'light');
    });
  });
}

// ---------- Mobile nav / sidebar toggle ----------
function initNavToggle() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const target = toggle && document.querySelector(toggle.dataset.navToggle);
  if (!toggle || !target) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    target.classList.toggle('open');
  });
}

// ---------- Toast ----------
// Creates (once) a single toast element and exposes window.showToast(msg)
function initToast() {
  let toastEl = document.querySelector('.toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }

  let hideTimer = null;
  window.showToast = function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  };
}

// ---------- Utilities shared by other scripts ----------

/** Format a number of paise/rupees as Indian currency, e.g. 52000 -> "₹52,000" */
function formatINR(amount) {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/**
 * Minimal HTML-escaping helper.
 * Anything that came from user input (form fields, localStorage, etc.)
 * is passed through this before being inserted into innerHTML, so a
 * value like "<script>" is rendered as text, not executed.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  initDarkModeToggle();
  initNavToggle();
  initToast();
});
