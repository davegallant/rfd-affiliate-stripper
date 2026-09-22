# RFD Affiliate Stripper

Remove affiliate redirects and tracking parameters from deal links on [RedFlagDeals forums](https://forums.redflagdeals.com/). The extension cleans supported links as a page loads and when new posts or links appear, so you can follow the destination directly. It can also help with redirect links that fail when an ad blocker is enabled.

[Install for Firefox](https://addons.mozilla.org/en-US/firefox/addon/rfd-redirect-stripper/) · [Install for Chrome](https://chromewebstore.google.com/detail/rfd-affiliate-stripper/nhjomcijhonhoggkckbjjfnjdcefbblo)

<img src="docs/images/popup.png" alt="Extension popup showing one cleaned link, the link tester, and the configuration URL" width="425">

## How it works

On `forums.redflagdeals.com`, the extension checks links in posts against its [redirect rules](redirects.json). For example, a `go.redirectingat.com` link containing an encoded Amazon product URL is replaced with the direct `amazon.ca/dp/...` link. Amazon rules also remove selected tracking parameters while preserving unrelated query values, seller and variant information, and URL fragments. Search keywords remain on Amazon search pages.

Only matching links are changed. If you installed the extension while an RFD tab was already open, reload that tab to start cleaning links and see its activity in the popup.

## Using the popup

- **Cleaned links:** Shows how many distinct links were cleaned on the current forum page. Expand **Recent cleaned links** to see up to 50 recent original and cleaned URL pairs. This history lives in the page's memory and resets on reload.
- **Test a link:** Paste an HTTP or HTTPS URL to preview the result and each rule applied. The tester does not open the destination. It reports invalid URLs and warns if cleaning stops at a cycle or the 20-step limit.
- **Rules status:** Shows the last successful rules update or an update error. Bundled rules are available before the first successful download and when there is no usable cached configuration.
- **Config URL:** Enter the URL of a trusted JSON rules file and select **Save** to validate and use it. **Reset** restores the default URL. Reload open forum pages after changing rules; the popup tester uses the current rules immediately.

The extension checks for updated rules hourly. If a download or validation fails, it keeps the last valid rules and shows the error in the popup.

## Running from source

Requires Node.js and npm. To run the extension in Firefox during development:

```sh
npm ci
npm run start:firefox
```

To run the checks and build a package in `web-ext-artifacts/`:

```sh
npm test
npm run lint
npm run build
```

## Contributing redirect rules

Rules live in [redirects.json](redirects.json). Open a pull request to add or update a rule. To try rules from your branch, set **Config URL** in the popup to its raw JSON file, for example:

```text
https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/my-new-branch/redirects.json
```

The file must contain a JSON array. Every rule needs a regex `pattern` with a named `baseUrl` capture group. An optional `name` labels it in the link tester. Supported operations are:

| Field | Effect |
| --- | --- |
| `destinationParam` | Read the destination URL from this query parameter. |
| `removeParams` | Remove the listed query parameters while preserving the encoding of retained values. |
| `removePathRef` | Remove a trailing `/ref=...` path segment. |

These operations run only when the rule's pattern matches. Rules using only a regex remain supported. The extension accepts only HTTP or HTTPS destinations and stops after 20 cleaning steps or a cycle. Use trusted rule sources: validation and redirect limits do not bound the runtime of an individual regex. [regex101.com](https://regex101.com/) can help test a pattern.

## Tampermonkey userscript

The project began as a [Tampermonkey](https://www.tampermonkey.net/) userscript. You can copy [script.js](script.js) into Tampermonkey if you prefer that format. It contains the cleaning rules and URL preservation logic, but the browser extension provides dynamic link monitoring, rule updates, and the popup.

## Store publishing

The [publish workflow](.github/workflows/publish.yaml) runs for `v*` tags and can be started manually with an existing tag. The tag must match the version in [manifest.json](manifest.json). It runs tests and linting, builds the package, and submits to stores whose credentials are configured. Store review may still be required before a version becomes public.

Complete the store listings in their dashboards, then add these GitHub Actions secrets:

| Store | Required secrets |
| --- | --- |
| Chrome Web Store | `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID` |
| Firefox Add-ons | `AMO_JWT_ISSUER`, `AMO_JWT_SECRET` |

Chrome uses an OAuth client and refresh token with the `chromewebstore` scope, plus IDs from the Chrome Developer Dashboard. Firefox uses an AMO API key and secret. A store's publishing job is skipped until all its secrets are present.
