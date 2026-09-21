(() => {
  const selector = 'a.postlink, a.autolinker_link';
  chrome.runtime.sendMessage({ type: 'getRedirects' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('rfd-affiliate-stripper:', chrome.runtime.lastError.message);
      return;
    }
    if (!response?.redirects) return;

    function clean(link) {
      if (!link.matches(selector)) return;
      const cleaned = stripRedirect(link.href, response.redirects);
      if (cleaned !== link.href) link.href = cleaned;
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
