# Changelog

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
- Content script is registered dynamically via `chrome.scripting` instead of being declared statically in the manifest

### Removed

- `chrome.storage` dependency
