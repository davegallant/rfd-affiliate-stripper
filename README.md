# rfd-affiliate-stripper

<a href="https://addons.mozilla.org/en-US/firefox/addon/rfd-redirect-stripper/"><img src="https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png" alt="Get rfd-affiliate-stripper for Firefox"></a>
<a href="https://chromewebstore.google.com/detail/rfd-affiliate-stripper/nhjomcijhonhoggkckbjjfnjdcefbblo?authuser=0&hl=en"><img src="https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png" alt="Get rfd-affiliate-stripper for Chrome"></a>

Strips affiliate redirects from deal links posted on RFD.

The extension cleans deal links on page load and when posts or links change. It transforms a link with tracking such as

```
http://www.amazon.ca/gp/redirect.html?ie=UTF8&location=https%3A%2F%2Fwww.amazon.ca%2Fdp%2FB09YXY3DKN%3Fref%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26ref_%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26social_share%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26starsLeft%3D1%26skipTwisterOG%3D1&tag=redflagdealsc-20&linkCode=ur2&camp=15121&creative=330641
```

into

```
https://www.amazon.ca/dp/B09YXY3DKN?starsLeft=1&skipTwisterOG=1
```

## Why?

This helps navigate around broken links when using certain adblockers.

## Using the popup

- See how many distinct links were cleaned on the current forum page and expand the last 50 original/destination pairs. This activity stays in the page's memory and resets on reload.
- Paste a URL into **Test a link** to preview the destination and applied rules without visiting the link. A warning identifies redirect chains that hit a cycle or the step limit.
- Check the last successful rules update and any update error. Reload forum tabs opened before installing the extension to enable cleaning and activity reporting.

Amazon cleanup preserves seller, variant, unrelated query values, and fragments. Search-related tracking is removed on product pages; search keywords remain intact on search pages.

## Building the extension

To build the extension, run:

```sh
npm install
npm run build
```

## Updating redirects

The browser extension checks for the latest [redirects.json](redirects.json) hourly. Bundled rules work immediately when there is no usable cached configuration, including offline. Failed or invalid updates retain the last valid rules and appear in the popup.

Saving a custom config validates all rules before replacing the URL and cached rules together. Extension upgrades preserve the custom URL. Changes apply to forum pages when they are reloaded; the popup link tester uses the current rules immediately.

Each rule requires a regex `pattern` with a named `baseUrl` capture; `name` labels the rule in the tester. Rules can also declare `destinationParam` to extract and decode one query value, `removeParams` (an array of parameter names) to preserve the encoding of retained values, or `removePathRef` to remove a trailing `/ref=...` path segment. These operations apply only when the rule's pattern matches. Legacy regex-only rules remain supported. Use only trusted rule sources; regex validation and redirect limits do not bound the runtime of an individual regex.

Open a pull request to this repo to update the redirects.

An easy way to test regex: [regex101.com](https://regex101.com/).

New config can be tested by pointing the config url of the extension to your own branch.

For example:

```text
https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/my-new-branch/redirects.json
```

## Tampermonkey Script

This was originally a [Tampermonkey](https://www.tampermonkey.net/) userscript before evolving into a browser extension.

To use as a tampermonkey script, copy [script.js](./script.js) into Tampermonkey.

The userscript includes the same cleaning rules and URL-preservation logic. Dynamic link monitoring and the popup features are provided by the browser extension.

## Checks

```sh
npm test
npm run lint
npm run build
```

Tests cover cleaning, dynamic-link handling, rule updates, popup activity, and the link tester. Test discovery excludes old build artifacts; extension packages exclude tests and development notes.
