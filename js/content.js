(() => {
  const settingKey = 'linkCleaningEnabled';
  const selector = 'a.postlink, a.autolinker_link';
  let counted = new WeakSet();
  const lastWritten = new WeakMap();
  const originals = new WeakMap();
  const activity = { count: 0, links: [] };
  let enabled = false;
  let redirects = null;
  let loading = false;
  let observer = null;
  let settingRevision = 0;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'getActivity') sendResponse({ ...activity, enabled });
  });

  function clean(link) {
    if (!enabled || !redirects || !link.matches(selector)) return;
    const original = link.href;
    if (lastWritten.get(link) === original) return;
    const cleaned = stripRedirect(original, redirects);
    if (cleaned !== original) {
      link.href = cleaned;
      // Read back the browser-normalized href before the observer sees our write.
      const written = link.href;
      lastWritten.set(link, written);
      originals.set(link, { original, cleaned: written });
      if (!counted.has(link)) {
        counted.add(link);
        activity.count++;
      }
      activity.links.push({ original, cleaned });
      if (activity.links.length > 50) activity.links.shift();
    }
  }

  function cleanTree(root) {
    if (root.nodeType !== 1) return;
    clean(root);
    root.querySelectorAll(selector).forEach(clean);
  }

  function start() {
    if (observer) return;
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') clean(record.target);
        else record.addedNodes.forEach(cleanTree);
      }
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['href', 'class'],
    });
    document.querySelectorAll(selector).forEach(clean);
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    document.querySelectorAll('a').forEach(link => {
      const previous = originals.get(link);
      if (previous && link.href === previous.cleaned) link.href = previous.original;
      originals.delete(link);
      lastWritten.delete(link);
    });
    counted = new WeakSet();
    activity.count = 0;
    activity.links = [];
  }

  function loadRedirects() {
    if (loading) return;
    loading = true;
    chrome.runtime.sendMessage({ type: 'getRedirects' }, (response) => {
      loading = false;
      if (chrome.runtime.lastError) {
        console.log('rfd-enhancement-suite:', chrome.runtime.lastError.message);
        return;
      }
      if (!response?.redirects) return;
      redirects = response.redirects;
      if (enabled) start();
    });
  }

  function setEnabled(value) {
    if (enabled === value) return;
    enabled = value;
    if (!enabled) stop();
    else if (redirects) start();
    else loadRedirects();
  }

  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local' || !Object.hasOwn(changes, settingKey)) return;
    settingRevision++;
    setEnabled(changes[settingKey].newValue !== false);
  });
  if (chrome.storage?.local?.get) {
    chrome.storage.local.get(settingKey).then(value => {
      if (!settingRevision) setEnabled(value[settingKey] !== false);
    }).catch(() => {
      if (!settingRevision) setEnabled(true);
    });
  } else {
    setEnabled(true);
  }
})();
