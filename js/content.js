(() => {
  const selector = 'a.postlink, a.autolinker_link';
  const counted = new WeakSet();
  const lastWritten = new WeakMap();
  const activity = { count: 0, links: [] };
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getActivity') sendResponse(activity);
  });
  chrome.runtime.sendMessage({ type: 'getRedirects' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('rfd-affiliate-stripper:', chrome.runtime.lastError.message);
      return;
    }
    if (!response?.redirects) return;

    function clean(link) {
      if (!link.matches(selector)) return;
      const original = link.href;
      if (lastWritten.get(link) === original) return;
      const cleaned = stripRedirect(original, response.redirects);
      if (cleaned !== original) {
        link.href = cleaned;
        // Read back the browser-normalized href before the observer sees our write.
        lastWritten.set(link, link.href);
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

    const observer = new MutationObserver((records) => {
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
  });
})();
