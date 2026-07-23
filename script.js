// ==UserScript==
// @name         RedFlagDeals Affiliate Stripper
// @author       Dave Gallant
// @description  Strip redirect links on forums.redflagdeals.com
// @downloadURL  https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/script.js
// @grant        none
// @match        *://forums.redflagdeals.com/*
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/script.js
// @version      2026-07-23
// ==/UserScript==

(function() {
    'use strict';

    var Links = document.querySelectorAll('a.postlink, a.autolinker_link');

    const REDIRECT_REGEX = [
  {
    "name": "Amazon redirect",
    "pattern": ".*amazon\\.(?:ca|com)\\/gp\\/redirect\\.html\\?ie=UTF8&location=(?<baseUrl>.*?)(?:&|ref%3D|%3F)"
  },
  {
    "name": "Amazon tag",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)\\S+?)(?:[?&])tag=[^&]*(?:&(?<rest>\\S+))?$"
  },
  {
    "name": "Amazon ref query param",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)\\S+?)(?:[?&])ref=[^&]*(?:&(?<rest>\\S+))?$"
  },
  {
    "name": "Amazon ref path segment",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)\\S+?)/ref=[^?]*(?:\\?(?<rest>\\S+))?$"
  },
  {
    "name": "Amazon search tracking params",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)/.*/dp/[A-Z0-9]+)\\?\\S+"
  },
  {
    "name": "Amazon ref_ query param",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)\\S+?)(?:[?&])ref_=[^&]*(?:&(?<rest>\\S+))?$"
  },
  {
    "name": "Amazon social_share query param",
    "pattern": "(?<baseUrl>https?://.*amazon\\.(?:ca|com)\\S+?)(?:[?&])social_share=[^&]*(?:&(?<rest>\\S+))?$"
  },
  {
    "name": "Best Buy",
    "pattern": "bestbuyca.(.*).net(.*)\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "HP",
    "pattern": "www.awin1.com(.*)&clickref=&p=(?<baseUrl>.*)"
  },
  {
    "name": "Samsung",
    "pattern": "www.awin1.com(.*)?p=(?<baseUrl>.*)"
  },
  {
    "name": "redirectingat.com",
    "pattern": "go.redirectingat.com/.*url=(?<baseUrl>.*).*"
  },
  {
    "name": "homedepot",
    "pattern": "the-home-depot-ca.pxf.io(.*)?u=(?<baseUrl>.*)"
  },
  {
    "name": "redirectingat",
    "pattern": "go.redirectingat.com(.*)?url=(?<baseUrl>.*)"
  },
  {
    "name": "sjv.io",
    "pattern": ".*sjv\\.io.*\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "canadiantire",
    "pattern": "imp.i([0-9]*).net(.*)?u=(?<baseUrl>.*)"
  },
  {
    "name": "underarmour",
    "pattern": "www.awin1.com(.*)?ued=(?<baseUrl>.*)"
  },
  {
    "name": "lenovo",
    "pattern": "(.*).evyy.net(.*)?u=(?<baseUrl>.*)"
  },
  {
    "name": "kqzyfj",
    "pattern": "www.kqzyfj.com(.*)?url=(?<baseUrl>.*)&sid=.*"
  },
  {
    "name": "walmart",
    "pattern": "click.linksynergy.com(.*)?murl=(?<baseUrl>.*)&u1=.*"
  },
  {
    "name": "dpbolvw.net",
    "pattern": "www.dpbolvw.net(.*)?url=(?<baseUrl>.*)"
  },
  {
    "name": "jdoqocy.com",
    "pattern": "www.jdoqocy.com(.*)?url=(?<baseUrl>.*)&sid=rfdcb"
  },
  {
    "name": "pfx.io",
    "pattern": "(.*).pxf.io(.*)?u=(?<baseUrl>.*)"
  },
  {
    "name": "avantlink.com",
    "pattern": "(.*).avantlink.com(.*)?url=(?<baseUrl>.*)"
  },
  {
    "name": "anrdoezrs.net",
    "pattern": ".*anrdoezrs\\.net.+\\?url=(?<baseUrl>.*)&sid=.*"
  },
  {
    "name": "tkqlhce.com",
    "pattern": ".*tkqlhce\\.com.+?url=(?<baseUrl>.*)&sid=.*"
  },
  {
    "name": "staples",
    "pattern": ".*staplescanada\\.4u8mqw\\.net.+\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "pjtra.com",
    "pattern": ".*pjtra\\.com.*\\?url=(?<baseUrl>.*)&sid.*"
  },
  {
    "name": "pjatr.com",
    "pattern": ".*pjatr\\.com.*\\?url=(?<baseUrl>.*)&sid.*"
  },
  {
    "name": "pntra.com",
    "pattern": ".*pntra\\.com.*\\?url=(?<baseUrl>.*)&sid.*"
  },
  {
    "name": "pntrs.com",
    "pattern": ".*pntrs\\.com.*\\?url=(?<baseUrl>.*)&sid.*"
  },
  {
    "name": "pntrac.com",
    "pattern": ".*pntrac\\.com.*\\?url=(?<baseUrl>.*)&sid.*"
  },
  {
    "name": "shareasale.com",
    "pattern": ".*shareasale\\.com.*&urllink=(?<baseUrl>.*)"
  },
  {
    "name": "mkr3.net",
    "pattern": ".*mkr3\\.net.*\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "njih.net",
    "pattern": "(.*).njih.net(.*)?u=(?<baseUrl>.*)"
  },
  {
    "name": "fintelconnect.com",
    "pattern": ".*fintelconnect\\.com.*\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "c2ukkg.net",
    "pattern": ".*c2ukkg\\.net.*\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "dodxnr.net",
    "pattern": ".*dodxnr\\.net.*\\?u=(?<baseUrl>.*)"
  },
  {
    "name": "doubleclick",
    "pattern": "adclick\\.g\\.doubleclick\\.net(.*)?adurl=(?<baseUrl>.*)"
  },
  {
    "name": "RFD subId1 tracking param",
    "pattern": "(?<baseUrl>https?://\\S+?)[&?]subId1=[^&]*(?:&(?<rest>\\S+))?$"
  }
]
;

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


    Links.forEach(function(Link) {
        var ReferralURL = Link.href;
        Link.href = stripRedirect(ReferralURL, REDIRECT_REGEX);
    });

})();
