/* ═══ MyMeet App Shell ═══ */

const App = (() => {
  const PAGE_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>', href: 'dashboard.html', key: 'd' },
    { id: 'create', label: 'Create', icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>', href: 'create.html', key: 'n' },
    { id: 'events', label: 'Events', icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="2" width="12" height="10" rx="1.5"/><line x1="1" y1="5.5" x2="13" y2="5.5"/><line x1="4.5" y1="2" x2="4.5" y2="5.5"/><line x1="9.5" y1="2" x2="9.5" y2="5.5"/></svg>', href: 'events.html', key: 'e' },
    { id: 'analytics', label: 'Analytics', icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="8" width="3" height="5" rx=".5"/><rect x="5.5" y="5" width="3" height="8" rx=".5"/><rect x="10" y="1" width="3" height="12" rx=".5"/></svg>', href: 'analytics.html', key: 'a' },
    { id: 'help', label: 'Help', icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="6"/><path d="M5 5.5a2 2 0 0 1 3.9.5c0 1-1.4 1.5-1.9 2"/><circle cx="7" cy="10.5" r=".5" fill="currentColor"/></svg>', href: 'help.html', key: 'h' }
  ];

  let currentPage = '';
  let toastQueue = [];

  /* ─── Init ─── */
  function init(pageId) {
    currentPage = pageId;
    initDarkMode();
    injectShell();
    initPageTransition();
    initKeyboardShortcuts();
    Storage.checkStorageWarning();

    // Onboarding check (F1)
    if (!Storage.hasOnboarded() && pageId === 'dashboard') {
      setTimeout(() => startTour(), 600);
    }
  }

  /* ─── Dark Mode ─── */
  function initDarkMode() {
    const saved = Storage.getPrefs().theme;
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      Storage.setPref('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      Storage.setPref('theme', 'dark');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark
      ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="3.5"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/><line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/><line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M13.5 9.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z"/></svg>';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  /* ─── Shell Injection (A2) ─── */
  function injectShell() {
    // Header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <a href="dashboard.html" class="app-logo" style="text-decoration:none;display:flex;align-items:center;gap:8px">
        <img src="background_removed.png" alt="MyMeet" style="height:32px;width:auto;display:block">
      </a>
      <nav class="header-nav">
        ${PAGE_NAV.map(n => `
          <a href="${n.href}" class="nav-link ${n.id === currentPage ? 'active' : ''}" data-page="${n.id}">
            <span class="nav-icon">${n.icon}</span>
            <span class="hide-mobile">${n.label}</span>
          </a>
        `).join('')}
      </nav>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn-icon" id="theme-toggle" onclick="App.toggleDarkMode()" style="border:none;background:none;font-size:18px;cursor:pointer;color:var(--text-muted);width:36px;height:36px;display:flex;align-items:center;justify-content:center" title="Toggle dark mode"></button>
        <button class="hamburger" id="hamburger-btn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;
    document.body.prepend(header);
    updateThemeIcon();

    // Mobile menu
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobile-overlay';
    document.body.appendChild(overlay);

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.id = 'mobile-menu';
    menu.innerHTML = PAGE_NAV.map(n => `
      <a href="${n.href}" class="nav-link ${n.id === currentPage ? 'active' : ''}">${n.icon} ${n.label}</a>
    `).join('');
    document.body.appendChild(menu);

    // Toast container
    const toasts = document.createElement('div');
    toasts.className = 'toast-container';
    toasts.id = 'toasts';
    document.body.appendChild(toasts);

    // Hamburger toggle
    const btn = document.getElementById('hamburger-btn');
    btn?.addEventListener('click', toggleMobile);
    overlay.addEventListener('click', closeMobile);

    // Nav link transitions
    document.querySelectorAll('.nav-link, .app-logo').forEach(link => {
      link.addEventListener('click', e => {
        if (link.href === location.href) { e.preventDefault(); return; }
        e.preventDefault();
        navigateTo(link.getAttribute('href'));
      });
    });
  }

  /* ─── Navigation with transition (B3) ─── */
  function navigateTo(url) {
    document.body.classList.add('page-exit');
    document.body.classList.remove('page-ready');
    setTimeout(() => { window.location.href = url; }, 140);
  }

  function initPageTransition() {
    // Theme is already set via inline head script before CSS loads.
    // Reveal body immediately once DOM is ready — no rAF delay.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => document.body.classList.add('page-ready'));
    } else {
      document.body.classList.add('page-ready');
    }

    // Intercept all internal link clicks for smooth transitions
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      // Skip external links, anchors, javascript:, and new-tab links
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript:') || link.target === '_blank') return;
      e.preventDefault();
      navigateTo(href);
    });
  }

  /* ─── Mobile Menu ─── */
  function toggleMobile() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-overlay');
    const btn = document.getElementById('hamburger-btn');
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    overlay.classList.toggle('show', !isOpen);
    btn.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }
  function closeMobile() {
    document.getElementById('mobile-menu')?.classList.remove('open');
    document.getElementById('mobile-overlay')?.classList.remove('show');
    document.getElementById('hamburger-btn')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ─── Toast System (B7) ─── */
  function toast(msg, type = '') {
    const container = document.getElementById('toasts');
    if (!container) return;
    const icons = { success: '✓', error: '✕', warning: '!' };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `
      ${icons[type] ? `<span class="toast-icon">${icons[type]}</span>` : ''}
      <span class="toast-text">${msg}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(t);
    // Auto-dismiss
    setTimeout(() => {
      t.classList.add('toast-exit');
      setTimeout(() => t.remove(), 250);
    }, 3500);
    // Limit visible toasts
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length > 4) toasts[0].remove();
  }

  /* ─── Modal System ─── */
  function showModal(id) { document.getElementById(id)?.classList.add('show'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

  function confirmModal({ title, message, confirmText = 'Confirm', danger = false, onConfirm }) {
    let overlay = document.getElementById('modal-confirm');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modal-confirm';
      overlay.innerHTML = `
        <div class="modal">
          <h3 id="confirm-title"></h3>
          <p id="confirm-body"></p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
            <button class="btn" id="confirm-ok"></button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-body').textContent = message;
    const okBtn = document.getElementById('confirm-ok');
    okBtn.textContent = confirmText;
    okBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    document.getElementById('confirm-cancel').onclick = () => closeModal('modal-confirm');
    okBtn.onclick = () => { closeModal('modal-confirm'); onConfirm(); };
    overlay.onclick = e => { if (e.target === overlay) closeModal('modal-confirm'); };
    showModal('modal-confirm');
  }

  function promptModal({ title, placeholder = '', value = '', onConfirm }) {
    let overlay = document.getElementById('modal-prompt');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modal-prompt';
      overlay.innerHTML = `
        <div class="modal">
          <h3 id="prompt-title"></h3>
          <div class="form-group" style="margin-bottom:20px">
            <input class="form-input" id="prompt-input" type="text">
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="prompt-cancel">Cancel</button>
            <button class="btn btn-primary" id="prompt-ok">Save</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    document.getElementById('prompt-title').textContent = title;
    const input = document.getElementById('prompt-input');
    input.placeholder = placeholder;
    input.value = value;
    setTimeout(() => input.focus(), 100);
    document.getElementById('prompt-cancel').onclick = () => closeModal('modal-prompt');
    document.getElementById('prompt-ok').onclick = () => {
      const v = input.value.trim();
      if (!v) { toast('Please enter a value', 'error'); return; }
      closeModal('modal-prompt');
      onConfirm(v);
    };
    input.onkeydown = e => { if (e.key === 'Enter') document.getElementById('prompt-ok').click(); };
    overlay.onclick = e => { if (e.target === overlay) closeModal('modal-prompt'); };
    showModal('modal-prompt');
  }

  /* ─── Confetti (B6) ─── */
  function confetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const shades = ['#111', '#333', '#555', '#777', '#999', '#bbb', '#ddd', '#fff'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = shades[Math.floor(Math.random() * shades.length)];
      piece.style.animationDelay = Math.random() * 1 + 's';
      piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
      piece.style.width = (4 + Math.random() * 6) + 'px';
      piece.style.height = (4 + Math.random() * 6) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.opacity = 0.6 + Math.random() * 0.4;
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
  }

  /* ─── Keyboard Shortcuts (F3) ─── */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // Don't trigger when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey) return;

      const nav = PAGE_NAV.find(n => n.key === e.key.toLowerCase());
      if (nav) { e.preventDefault(); navigateTo(nav.href); return; }

      if (e.key === '?') {
        e.preventDefault();
        showShortcutsHelp();
      }
    });
  }

  function showShortcutsHelp() {
    let overlay = document.getElementById('modal-shortcuts');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modal-shortcuts';
      overlay.innerHTML = `
        <div class="modal" style="max-width:380px">
          <h3>Keyboard Shortcuts</h3>
          <p style="margin-bottom:16px">Navigate faster with your keyboard.</p>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${PAGE_NAV.map(n => `
              <div class="shortcut-row" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg-soft)">
                <span style="font-size:14px;color:var(--text-soft)">${n.label}</span>
                <kbd>${n.key.toUpperCase()}</kbd>
              </div>
            `).join('')}
            <div class="shortcut-row" style="display:flex;justify-content:space-between;padding:8px 0">
              <span style="font-size:14px;color:var(--text-soft)">Show shortcuts</span>
              <kbd>?</kbd>
            </div>
          </div>
          <div class="modal-actions" style="margin-top:20px">
            <button class="btn btn-primary" onclick="App.closeModal('modal-shortcuts')">Got it</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.onclick = e => { if (e.target === overlay) closeModal('modal-shortcuts'); };
    }
    showModal('modal-shortcuts');
  }

  /* ─── Onboarding Tour (F1) ─── */
  let tourStep = 0;
  let tourSteps = [];

  function startTour(steps) {
    const defaultSteps = [
      {
        target: '.app-logo',
        title: 'Welcome to MyMeet!',
        text: 'This is your career fair command center. Let me show you around, it only takes a moment.',
        position: 'bottom'
      },
      {
        target: '.dash-grid .dash-card:first-child',
        title: 'Create Events',
        text: 'Start here. Our wizard walks you through setting up an event with Zoom links, venues, QR codes, and more.',
        position: 'bottom'
      },
      {
        target: '.dash-grid .dash-card:nth-child(3)',
        title: 'Analytics Builder',
        text: 'Define what data you want to collect: degree, company size, role. Watch charts appear instantly.',
        position: 'top'
      },
      {
        target: '.header-nav',
        title: 'Navigate Anywhere',
        text: 'Jump between sections here. Pro tip: press D, N, E, A, or H on your keyboard for instant navigation.',
        position: 'bottom'
      }
    ];
    tourSteps = steps || defaultSteps;
    tourStep = 0;
    showTourStep();
  }

  function showTourStep() {
    removeTour();
    if (tourStep >= tourSteps.length) {
      Storage.setOnboarded();
      toast('You\'re all set! Enjoy MyMeet.', 'success');
      return;
    }

    const step = tourSteps[tourStep];
    const el = document.querySelector(step.target);
    if (!el) { tourStep++; showTourStep(); return; }

    const rect = el.getBoundingClientRect();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'tour-backdrop';
    backdrop.id = 'tour-backdrop';
    document.body.appendChild(backdrop);

    // Highlight
    const highlight = document.createElement('div');
    highlight.className = 'tour-highlight';
    highlight.id = 'tour-highlight';
    highlight.style.top = (rect.top - 6) + 'px';
    highlight.style.left = (rect.left - 6) + 'px';
    highlight.style.width = (rect.width + 12) + 'px';
    highlight.style.height = (rect.height + 12) + 'px';
    document.body.appendChild(highlight);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.id = 'tour-tooltip';
    tooltip.innerHTML = `
      <div class="tour-progress">
        ${tourSteps.map((_, i) => `<div class="tour-dot ${i === tourStep ? 'active' : ''}"></div>`).join('')}
      </div>
      <h4>${step.title}</h4>
      <p>${step.text}</p>
      <div class="tour-actions">
        <button class="tour-skip" id="tour-skip">${tourStep === 0 ? 'Skip tour' : 'Skip'}</button>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="tour-step-count">${tourStep + 1} of ${tourSteps.length}</span>
          <button class="btn btn-primary btn-sm" id="tour-next">${tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    `;

    // Position tooltip
    const pad = 16;
    if (step.position === 'bottom') {
      tooltip.style.top = (rect.bottom + pad) + 'px';
      tooltip.style.left = Math.max(16, rect.left) + 'px';
    } else {
      tooltip.style.top = (rect.top - pad) + 'px';
      tooltip.style.left = Math.max(16, rect.left) + 'px';
      tooltip.style.transform = 'translateY(-100%)';
    }
    document.body.appendChild(tooltip);

    document.getElementById('tour-next').onclick = () => { tourStep++; showTourStep(); };
    document.getElementById('tour-skip').onclick = () => { removeTour(); Storage.setOnboarded(); };
    backdrop.onclick = () => { removeTour(); Storage.setOnboarded(); };
  }

  function removeTour() {
    ['tour-backdrop', 'tour-highlight', 'tour-tooltip'].forEach(id => {
      document.getElementById(id)?.remove();
    });
  }

  /* ─── Skeleton Loader (B2) ─── */
  function showSkeleton(container, count = 3) {
    container.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card" style="margin-bottom:12px">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:40%"></div>
      </div>
    `).join('');
  }

  /* ─── Time Display ─── */
  function formatTime() {
    const n = new Date();
    return n.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
      ' · ' + n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /* ─── Drag & Drop Reorder (C5) ─── */
  function initDragReorder(listEl, onReorder) {
    let dragIdx = null;
    listEl.addEventListener('dragstart', e => {
      const item = e.target.closest('[data-drag-idx]');
      if (!item) return;
      dragIdx = parseInt(item.dataset.dragIdx);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    listEl.addEventListener('dragover', e => {
      e.preventDefault();
      const item = e.target.closest('[data-drag-idx]');
      if (item) item.classList.add('drag-over');
    });
    listEl.addEventListener('dragleave', e => {
      const item = e.target.closest('[data-drag-idx]');
      if (item) item.classList.remove('drag-over');
    });
    listEl.addEventListener('drop', e => {
      e.preventDefault();
      const item = e.target.closest('[data-drag-idx]');
      if (!item || dragIdx === null) return;
      const dropIdx = parseInt(item.dataset.dragIdx);
      item.classList.remove('drag-over');
      if (dragIdx !== dropIdx) onReorder(dragIdx, dropIdx);
      dragIdx = null;
    });
    listEl.addEventListener('dragend', () => {
      listEl.querySelectorAll('[data-drag-idx]').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
      });
      dragIdx = null;
    });
  }

  /* ─── SVG Empty State Icons (B5) ─── */
  const EMPTY_SVGS = {
    events: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="16" width="56" height="52" rx="6"/><line x1="12" y1="30" x2="68" y2="30"/><line x1="28" y1="16" x2="28" y2="8"/><line x1="52" y1="16" x2="52" y2="8"/><circle cx="32" cy="46" r="3"/><circle cx="48" cy="46" r="3"/><circle cx="32" cy="56" r="3"/></svg>`,
    analytics: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="44" width="12" height="24" rx="2"/><rect x="26" y="32" width="12" height="36" rx="2"/><rect x="42" y="20" width="12" height="48" rx="2"/><rect x="58" y="36" width="12" height="32" rx="2"/><line x1="6" y1="72" x2="74" y2="72"/></svg>`,
    qr: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="12" width="20" height="20" rx="2"/><rect x="48" y="12" width="20" height="20" rx="2"/><rect x="12" y="48" width="20" height="20" rx="2"/><rect x="48" y="48" width="12" height="12" rx="2"/><line x1="64" y1="48" x2="64" y2="68"/><line x1="48" y1="64" x2="68" y2="64"/></svg>`,
    help: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="36" r="24"/><path d="M32 32c0-4.4 3.6-8 8-8s8 3.6 8 8c0 4-4 6-4 8H36"/><circle cx="40" cy="48" r="1.5" fill="currentColor"/><path d="M28 60l-8 12h40l-8-12"/></svg>`
  };

  return {
    init,
    toast,
    showModal,
    closeModal,
    confirmModal,
    promptModal,
    confetti,
    navigateTo,
    showSkeleton,
    formatTime,
    initDragReorder,
    startTour,
    toggleDarkMode,
    EMPTY_SVGS,
    PAGE_NAV
  };
})();

window.App = App;
