# Modern RFD browser validation

Implementation worktree: `codex/modern-rfd`. Automated runs use sanitized, offline fixtures. They do not prove that the loaded extension works on the current live forum or with a signed-in account.

## Completed locally

- Node regression suite: 117 tests after review fixes, verified 2026-09-26.
- Playwright fixture rendering: Chromium and Firefox at 390, 768 and 1440 px for list/thread. Checks activation, row compactness, no page overflow and native theme restoration after turning Modern view off.
- Saved public forum HTML from 2026-09-26 had 43 deal rows recognized when rendered offline with the site's public CSS. Its scripts were removed, so interactive controls were not validated.
- Headless live RFD navigation did not reach DOM ready or a visible `#forum-topics` within 20/12 seconds respectively. Do not treat this as a site defect or an extension pass/fail.

## Release gate: real extension and authenticated interaction

On a current RFD forum list and thread in Brave/Chromium and Firefox:

- Confirm Modern view is initially on and the page has no major layout breakage. Check menus, filters, sort, pagination, search, post anchors and recovery through the popup switch.
- Toggle System/Light/Dark, Compact, width and 20 px text. Cross-check the site's own dark-mode setting. Test at narrow width, 200% zoom and keyboard focus.
- Confirm page-local cleaned links still rewrite while appearance is off.
- Signed in: enter a disposable draft and preview, inspect quote, voting, report, subscribe and edit controls. Do not submit votes, reports or posts merely for the smoke check.
- Check modal and editor layering, inline images/tables/quotes/spoilers, and old/classic listing fallback.
- Firefox Android requires a separate device check. Desktop responsive testing does not establish Android support.
- Verify Hide signatures on a live thread with a signature. The verified `div.signature[id^="sig"]` selector is used; other markup remains visible.

Record date, browser build, OS, page URL type (avoid private URLs), pass/fail and screenshots before store submission. Resolve failures before publishing.
