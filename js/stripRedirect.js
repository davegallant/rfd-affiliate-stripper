function isHttpUrl(url) {
  return /^https?:\/\//i.test(url);
}

function stripRedirect(URL, redirectRegex) {
  var previousURL;
  do {
    previousURL = URL;
    for (var i = 0; i < redirectRegex.length; i++) {
      var rule = redirectRegex[i];
      var result = new RegExp(rule.pattern).exec(URL);

      if (result) {
        var newURL = result.groups.baseUrl;
        if (result.groups.rest) {
          newURL += (newURL.includes("?") ? "&" : "?") + result.groups.rest;
        }
        try {
          newURL = decodeURIComponent(newURL);
        } catch (e) {
          console.log(e);
          break;
        }
        // Never rewrite a link to a non-http(s) scheme (e.g. javascript:),
        // even if a redirect rule's capture group extracted one.
        if (isHttpUrl(newURL)) {
          URL = newURL;
        }
        break;
      }
    }
  } while (URL !== previousURL);

  return URL;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { stripRedirect, isHttpUrl };
}
