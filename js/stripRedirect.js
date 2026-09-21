function isHttpUrl(url) {
  return /^https?:\/\//i.test(url);
}

function stripRedirect(URL, redirectRegex) {
  const seen = new Set([URL]);
  const rules = [];
  for (const rule of Array.isArray(redirectRegex) ? redirectRegex : []) {
    try {
      if (typeof rule?.pattern === 'string') rules.push(new RegExp(rule.pattern));
    } catch { /* Ignore invalid legacy cached rules. */ }
  }
  for (let step = 0; step < 20; step++) {
    const previousURL = URL;
    for (const regex of rules) {
      const result = regex.exec(URL);
      if (result?.groups?.baseUrl) {
        var newURL = result.groups.baseUrl;
        if (result.groups.rest) {
          newURL += (newURL.includes("?") ? "&" : "?") + result.groups.rest;
        }
        try {
          newURL = decodeURIComponent(newURL);
        } catch {
          continue;
        }
        // Never rewrite a link to a non-http(s) scheme (e.g. javascript:),
        // even if a redirect rule's capture group extracted one.
        if (isHttpUrl(newURL) && newURL !== URL) {
          if (seen.has(newURL)) return URL;
          URL = newURL;
          seen.add(URL);
          break;
        }
      }
    }
    if (URL === previousURL) break;
  }

  return URL;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { stripRedirect, isHttpUrl };
}
