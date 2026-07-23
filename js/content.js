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