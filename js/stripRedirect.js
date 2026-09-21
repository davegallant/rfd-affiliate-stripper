function isHttpUrl(url) {
  try {
    return /^https?:\/\//i.test(url) && ['http:', 'https:'].includes(new URL(url).protocol);
  } catch { return false; }
}

function stripRedirect(URL, redirectRegex) {
  if (!isHttpUrl(URL)) return URL;
  return inspectRedirect(URL, redirectRegex).url;
}

function inspectRedirect(URL, redirectRegex) {
  if (!isHttpUrl(URL)) throw new Error('Enter a valid HTTP or HTTPS URL');
  const steps = [];
  const seen = new Set([URL]);
  const rules = [];
  for (const rule of Array.isArray(redirectRegex) ? redirectRegex : []) {
    try {
      if (typeof rule?.pattern === 'string') rules.push({
        regex: new RegExp(rule.pattern), name: rule.name || 'Unnamed rule',
      });
    } catch { /* Ignore invalid legacy cached rules. */ }
  }
  for (let step = 0; step < 20; step++) {
    const previousURL = URL;
    for (const { regex, name } of rules) {
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
          if (seen.has(newURL)) return { url: URL, steps, limited: true };
          steps.push({ rule: name, original: URL, cleaned: newURL });
          URL = newURL;
          seen.add(URL);
          break;
        }
      }
    }
    if (URL === previousURL) return { url: URL, steps, limited: false };
  }

  return { url: URL, steps, limited: true };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { stripRedirect, inspectRedirect, isHttpUrl };
}
