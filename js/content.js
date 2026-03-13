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
          URL = decodeURIComponent(newURL);
        } catch (e) {
          console.log(e);
        }
        break;
      }
    }
  } while (URL !== previousURL);

  return URL;
}

function stripRedirects() {
  var Links = document.querySelectorAll("a.postlink, a.autolinker_link");

  chrome.runtime.sendMessage({ type: "getRedirects" }, function (response) {
    if (chrome.runtime.lastError) {
      console.log("rfd-affiliate-stripper: could not fetch redirects:", chrome.runtime.lastError.message);
      return;
    }
    if (response && response.redirects) {
      Links.forEach(function (Link) {
        var ReferralURL = Link.href;
        Link.href = stripRedirect(ReferralURL, response.redirects);
      });
    }
  });
}

stripRedirects();