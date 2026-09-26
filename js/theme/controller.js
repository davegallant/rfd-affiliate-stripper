(() => {
  const api = globalThis.RFDModern ||= {};
  const attributes = ['enabled', 'page', 'theme', 'density', 'font-size', 'width', 'hide-promotions', 'hide-sidebar', 'hide-signatures', 'compact-profiles'];
  let status = { enabled: false, applied: false, page: 'unsupported', reason: 'disabled' };
  function getStatus() { return { ...status }; }
  function start(document, window) {
    let active = true, generation = 0, current = null, match = null, forceNative = false;
    let journal = api.dom.createJournal();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function clear() { journal.restore(); journal = api.dom.createJournal(); }
    function apply(settings) {
      if (!active) return;
      clear();
      current = settings;
      match = api.adapters.detect(document, new URL(window.location.href));
      if (!settings.enabled || forceNative || !match) {
        status = { enabled: settings.enabled, applied: false, page: match?.kind || 'unsupported', reason: settings.enabled && !forceNative ? 'unsupported' : 'disabled' };
        return;
      }
      try {
        const html = document.documentElement;
        const values = { enabled: 'true', page: match.kind, theme: settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme,
          density: settings.density, 'font-size': String(settings.fontSize), width: settings.contentWidth,
          'hide-promotions': String(settings.hidePromotions), 'hide-sidebar': String(settings.hideSidebar), 'hide-signatures': String(settings.hideSignatures), 'compact-profiles': String(settings.compactProfiles) };
        for (const name of attributes) journal.setAttribute(html, 'data-rfdm-' + name, values[name]);
        api.adapters.enhanceShell(document, match, journal);
        if (match.kind === 'list') api.list?.enhance(match.root, settings, journal);
        if (match.kind === 'thread') api.thread?.enhance(match.root, settings, journal);
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'rfdm-original-view'; button.textContent = 'Original view';
        button.addEventListener('click', async () => {
          clear(); current = { ...current, enabled: false };
          status = { enabled: false, applied: false, page: match.kind, reason: 'disabled' };
          try { await api.settings.save({ enabled: false }); }
          catch {
            forceNative = true;
            const note = document.createElement('span'); note.setAttribute('role', 'status');
            note.textContent = 'Could not save appearance setting';
            journal.appendOwned(buttonParent, note);
          }
        });
        const buttonParent = match.root.parentElement || document.body;
        journal.appendOwned(buttonParent, button);
        if (match.root.parentElement === buttonParent) buttonParent.insertBefore(button, match.root);
        status = { enabled: true, applied: true, page: match.kind, reason: null };
      } catch (error) {
        clear();
        status = { enabled: true, applied: false, page: match.kind, reason: 'adapter-error' };
        console.warn('RFD Modern view:', error);
      }
    }
    const added = new Set();
    let scheduled = false;
    const observer = new window.MutationObserver(records => {
      if (!active || !current?.enabled) return;
      if (match?.root && !match.root.isConnected) {
        added.clear();
        if (!scheduled) { scheduled = true; window.requestAnimationFrame(() => { scheduled = false; if (active && current?.enabled) apply(current); }); }
        return;
      }
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1 || node.matches?.('[data-rfdm-owned]') || node.closest?.('[data-rfdm-owned]')) continue;
        added.add(node);
      }
      if (!added.size || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        if (!active || !current?.enabled || !match) { added.clear(); return; }
        if (!match.root.isConnected) { added.clear(); apply(current); return; }
        const roots = [...added]; added.clear();
        for (const node of roots) {
          if (!node.isConnected || !match.root.contains(node)) continue;
          try {
            if (match.kind === 'list') api.list?.enhance(node, current, journal);
            if (match.kind === 'thread') api.thread?.enhance(node, current, journal);
          } catch (error) { console.warn('RFD Modern view:', error); }
        }
        journal.prune();
      });
    });
    const stopSettings = api.settings.subscribe(settings => {
      generation++;
      if (!settings.enabled) forceNative = false;
      apply(settings);
    });
    const mediaChanged = () => { if (current?.enabled && current.theme === 'system') apply(current); };
    media.addEventListener('change', mediaChanged);
    const message = (request, sender, respond) => { if (request?.type === 'getThemeStatus') respond(getStatus()); };
    chrome.runtime.onMessage.addListener(message);
    async function ready() {
      if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
      if (!active) return;
      if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
      const started = generation;
      try { const settings = await api.settings.load(); if (started === generation && active) apply(settings); }
      catch { if (started === generation && active) { clear(); status = { enabled: false, applied: false, page: 'unsupported', reason: 'settings-error' }; } }
    }
    ready();
    return () => { active = false; stopSettings(); media.removeEventListener('change', mediaChanged); chrome.runtime.onMessage.removeListener(message); observer.disconnect(); clear(); };
  }
  api.controller = { start, getStatus };
})();
