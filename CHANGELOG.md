## Unreleased

- Rename the extension to RFD Enhancement Suite and add a default-on, reversible Modern view for deal lists and discussion threads.
- Add appearance controls to the popup; turning the view off keeps affiliate-link cleaning active.
- Add Chromium and Firefox fixture rendering checks and a Brave unpacked-loading recipe.

# Changelog

## 0.8.1 - 2026-09-22

### Changed

- Match the popup to the browser's light or dark color preference with a neutral GitHub-inspired palette

## 0.8.0 - 2026-09-21

### Added

- Clean affiliate links added to a forum page after it loads, including links whose URL or eligible class changes
- Use bundled redirect rules when cached or remote rules are unavailable, so the extension works on a fresh offline installation
- Show the current page's cleaned-link count, recent original/destination pairs, and rules-update status in the popup
- Add a popup link tester that previews the cleaned destination and each matching rule without opening the link
- Validate remote redirect rules before applying them and retain the last valid rules when an update fails

### Fixed

- Preserve Amazon seller, variant, unrelated parameters, fragments, and encoded query values while removing tracking data
- Stop cyclic or expanding redirect chains after a bounded number of transformations
- Keep the Tampermonkey userscript synchronized with the extension's URL-cleaning behavior

### Changed

- Exclude development tests and notes from packaged extension artifacts

## 0.7.0 - 2026-07-23

### Added

- Strip `adclick.g.doubleclick.net` Google Ads redirects
- Strip `njih.net` (Impact Radius) affiliate redirects
- Strip stray `subId1` tracking parameters left dangling on destination URLs
- Strip Amazon `ref_` and `social_share` tracking parameters from mobile/share links

### Fixed

- Redirect stripping no longer rewrites a link to a non-http(s) URL (e.g. `javascript:`), closing a click-triggered DOM XSS path where a crafted forum link's tracking parameter could be replayed back into `href`
- Tampermonkey userscript (`script.js`) now shares the exact same stripping logic as the browser extension, instead of a hand-copied version that had drifted out of sync (it was missing chained-redirect handling and query param preservation)

### Changed

- `stripRedirect` logic extracted into a shared module (`js/stripRedirect.js`) used by the extension, the userscript template, and the test suite, so the two can no longer diverge silently

## 0.6.1 - 2026-03-13

### Added

- Strip Amazon affiliate `tag` parameter from direct product URLs
- Strip Amazon internal `ref` tracking from both URL path segments and query parameters
- Multiple redirect rules can now be applied to the same URL in successive passes
- Unit tests for all redirect stripping rules using Node's built-in test runner
- GitHub Actions workflow to run tests on push and pull request
- Popup now shows success/error feedback when saving or resetting config
- URL validation on save — checks for valid URL format, reachability, and valid JSON response

### Changed

- Replaced `chrome.storage` with IndexedDB for persisting config and redirects
- Content script now requests redirects from the background script via messaging instead of reading from `chrome.storage` directly

### Removed

- `chrome.storage` dependency
