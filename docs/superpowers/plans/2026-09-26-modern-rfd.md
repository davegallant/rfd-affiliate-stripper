# Modern RFD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute inline in the handoff session; use subagents only if separately authorized. Read the design brief first.

**Goal:** Add an optional, modern reading interface for RFD deal lists and threads while preserving native forum behavior and existing link cleaning.

**Architecture:** Add isolated, ordered classic content scripts and scoped CSS for presentation. Page adapters recognize verified native DOM structures, mark elements reversibly and leave their identity intact. Local settings drive appearance across open tabs; the existing cleaner remains independent.

**Tech Stack:** Vanilla JavaScript/CSS, MV3, `chrome.storage.local`, Node's test runner, web-ext. Add jsdom and Playwright as development-only dependencies for DOM and browser validation; keep all runtime code unbundled.

**Spec:** [Modern RFD design brief](../specs/2026-09-26-modern-rfd-design.md).

**Status:** Planning artifact, not executed. User confirmed deal lists and threads first. Remaining design choices are explicit recommendations in the spec. First inspect current git state; do not mistake this document for evidence that implementation or tests already exist.

## Global Constraints

- Preserve the current runtime stack: vanilla JavaScript and CSS, no runtime dependencies, no bundler.
- Preserve browser floors: Chrome 121, Firefox desktop 112, Firefox Android 113.
- Add only the `storage` permission; retain existing permissions and URL matches.
- Store appearance locally under independent `rfdm.*` keys in `chrome.storage.local`; do not migrate or alter redirect IndexedDB.
- Keep `js/content.js` at `document_end`; add a separate ordered theme script entry at `document_start` with bundled scoped CSS.
- Package all scripts/styles locally. No remote CSS, fonts, scripts, analytics, content uploads or custom-CSS field.
- No replacement application, cloned posts, recreated forms, navigation interception, request blocking or remote selector service.
- Appearance is off by default on both installs and upgrades. Original view disables appearance globally without disabling cleaning.
- Do not modify generated userscript files for theming; do not rename extension IDs, repository or publishing credentials.
- Preserve pre-existing changes/untracked files. Do not publish, tag or submit live forum actions as part of validation.

## Review Focus

1. Changed or incomplete RFD templates must remain readable and native, without hiding actual posts. Covered by Tasks 1, 3, 4 and 7.
2. RFD dark mode, extension theme and OS theme can disagree; appearance must resolve predictably and removal must restore the native state. Covered by Tasks 3 and 7.
3. Signed-in editors, delegated actions, anchors and third-party-inserted nodes must keep their identity and behavior. Covered by Tasks 5 and 7, plus the authenticated manual gate.
4. Slow/failed settings reads and simultaneous popup changes must not apply stale state or lose unrelated preferences. Covered by Tasks 2, 3 and 6.
5. Repeated enable/disable cycles and mutation bursts must not create duplicate controls, retained detached DOM or feedback loops. Covered by Tasks 3 and 7.

## Repository map and proposed files

Existing files to understand first: `manifest.json`, `js/content.js`, `js/background.js`, `js/utils.js`, `js/popup.js`, `html/popup.html`, `css/popup.css`, all root `*.test.js`, `package.json`, and build/test/publish workflows. The older `docs/superpowers/plans/2026-09-21-enhancements.md` describes already-implemented cleaner work; do not execute it again.

| File | Responsibility |
| --- | --- |
| `js/theme/settings.js` | Pure schema/normalization, local storage access and subscriptions |
| `js/theme/dom.js` | Ownership-aware markers and cleanup journal |
| `js/theme/adapters.js` | Verified selector catalog and page recognition |
| `js/theme/list.js` | Deal-list markers and promotion classification |
| `js/theme/thread.js` | Thread/profile/signature markers |
| `js/theme/controller.js` | Readiness, appearance lifecycle, batching, theme resolution, recovery button, status |
| `css/forum-theme.css` | All host-page presentation, scoped and tokenized |
| `js/popupAppearance.js` | Appearance controls and current-page theme status only |
| `docs/testing/rfd-dom-inventory.md` | Selector evidence, supported variants, intentional exclusions |
| `docs/testing/modern-rfd-manual.md` | Browser matrix, authenticated checks, results and limitations |
| `test/fixtures/rfd/*.html` | Sanitized inert templates with realistic hierarchy |
| `test/helpers/themeHarness.cjs` | jsdom + extension API/observer harness |
| `themeSettings.test.js`, `themeAdapters.test.js`, `themeController.test.js`, `themeList.test.js`, `themeThread.test.js`, `popupAppearance.test.js` | Focused Node tests included by existing root test glob |
| `test/browser/modern-rfd.spec.cjs`, `playwright.config.cjs` | Offline fixture rendering and browser behavior tests |

Runtime files use IIFEs and one isolated-world namespace, `globalThis.RFDModern`. Each attaches only its named API; no ES imports in declared content scripts. Node tests load the same production sources into a jsdom VM in manifest order. Load `settings.js` as a classic script before popup module scripts; `popupAppearance.js` accesses the same API. Existing `js/popup.js` remains focused on link tooling. Do not add `type: module` to package.json or change the test/module strategy for unrelated code.

### Shared interfaces

Use JSDoc types for these contracts, defined in `settings.js` / `adapters.js`; no TypeScript conversion:

```text
Settings = {
  enabled: boolean,                         // false
  theme: 'system' | 'light' | 'dark',         // system
  density: 'comfortable' | 'compact',        // comfortable
  fontSize: 16 | 18 | 20,                    // 16
  contentWidth: 'standard' | 'wide',          // standard
  hidePromotions: boolean,                  // true
  hideSignatures: boolean,                  // true
  compactProfiles: boolean                  // true
}
PageMatch = { kind: 'list' | 'thread', variant: string, root: Element }
ThemeStatus = { enabled: boolean, applied: boolean,
  page: 'list' | 'thread' | 'unsupported',
  reason: null | 'disabled' | 'unsupported' | 'settings-error' | 'adapter-error' }
Cleanup = () => void
```

Exports:

```text
RFDModern.settings.DEFAULTS: frozen Settings
RFDModern.settings.normalize(raw: unknown): Settings
RFDModern.settings.load(): Promise<Settings>
RFDModern.settings.save(patch: Partial<Settings>): Promise<void>
RFDModern.settings.reset(): Promise<void>
RFDModern.settings.subscribe(fn: (settings: Settings) => void): Cleanup

RFDModern.dom.createJournal(): {
  setAttribute(element: Element, name: string, value: string): void,
  appendOwned(parent: Element, node: Element): void,
  prune(): void,
  restore(): void
}
RFDModern.adapters.detect(document: Document, url: URL): PageMatch | null
RFDModern.adapters.SELECTORS: frozen catalog of verified selectors
RFDModern.adapters.enhanceShell(document: Document, match: PageMatch, journal: Journal): void
RFDModern.list.enhance(root: Element, settings: Settings, journal: Journal): void
RFDModern.thread.enhance(root: Element, settings: Settings, journal: Journal): void
RFDModern.controller.start(document: Document, window: Window): Cleanup
RFDModern.controller.getStatus(): ThemeStatus
```

`Journal` is the return type of `createJournal()`. Settings/API access errors reject promises; UI/controller catches them. `subscribe` returns normalized complete settings for each relevant local change. Adapter enhancement is idempotent, synchronous and performs no network requests. The controller calls it on an initial page root and subsequently on added elements; implementations must match the root itself as well as descendants. Pass settings through unchanged; all setting-dependent visibility is implemented via root attributes and CSS, so ordinary settings changes do not rebuild posts.

## Task 1: Establish verified page contracts and a DOM harness

**Files:** Create inventory, `test/fixtures/rfd/`, harness, `js/theme/adapters.js`, `themeAdapters.test.js`; modify `package.json` and lockfile for jsdom only.

**Interfaces:** Produces `adapters.detect`, `adapters.SELECTORS` and test helper `loadThemeFixture(name, options = {})`, returning `{ window, document, api, storage, flush, dispose }`. `api` is `window.RFDModern`; `storage` is a controllable fake extension store, `flush()` awaits queued work, `dispose()` closes the DOM. Do not install dependencies until implementation begins.

- [ ] Inspect branch/status and applicable repository instructions. Establish an isolated worktree if needed. Run baseline `npm test` and `npm run lint`; record pre-existing failures separately.
- [ ] Fetch/inspect actual list and thread DOM. Record source URL, date, logged-in/out state, theme and card/classic variant for each selector. Use the spec's observations as starting points; inspect ancestry and native styles before writing layout rules.
- [ ] Create sanitized fixtures: `list-card.html`, `list-empty.html`, `thread.html`, `thread-rich.html`, `thread-editor.html`, `unsupported.html`. Replace usernames/content with synthetic data, preserve hierarchy/classes/native link types, remove scripts, tokens, cookies, personal data and remote embeds. Editor fixture may be synthetic until authenticated evidence exists; label it explicitly. Never present synthetic markup as a captured template.
- [ ] Add a Node-24-compatible jsdom dev dependency and harness using `runScripts: 'outside-only'`; no host scripts or external resources execute. Include fake `storage.local`, `storage.onChanged`, runtime messages, matchMedia, animation-frame scheduling and MutationObserver control needed for actual production sources.
- [ ] Write `themeAdapters.test.js` cases: `detects verified card list`, `detects ordinary thread`, `recognizes verified empty listing`, `rejects unsupported host and template`, `does not mistake sidebar .thread_title for a thread`, `rejects login/compose/search/print view`. Assert result kind/root identity, or exactly `null`.
- [ ] Run `node --test themeAdapters.test.js` and confirm failures for missing behavior.
- [ ] Implement structural recognition. Require `forums.redflagdeals.com`, HTTP(S), verified page root and expected relationships. Known unsupported routes take precedence even if a shared sidebar contains matching nodes. A zero-row list requires an observed list shell plus native empty-state evidence. If unavailable, record that template as unsupported and add a native-fallback assertion; do not guess its structure.
- [ ] Run `node --test themeAdapters.test.js`; require all cases pass. Record initially supported variants (`card-v1`, `thread-v1`) and exclusions in inventory.

**Acceptance:** Detection is based on documented DOM evidence; unknown templates cause no mutations. No claim of support rests solely on a URL regex or `.thread_title`.

## Task 2: Persist independent appearance settings

**Files:** Create `js/theme/settings.js`, `themeSettings.test.js`; modify `manifest.json` to add `storage`.

**Interfaces:** Produces all `RFDModern.settings` APIs. Keys are `rfdm.enabled`, `rfdm.theme`, `rfdm.density`, `rfdm.fontSize`, `rfdm.contentWidth`, `rfdm.hidePromotions`, `rfdm.hideSignatures`, `rfdm.compactProfiles`, plus `rfdm.schemaVersion` = 1. Store each preference separately so unrelated concurrent edits do not overwrite one another. Same-key last committed write wins.

- [ ] Write tests: `missing keys use exact defaults`; `normalization drops unknown fields and rejects invalid enums/types`; `false booleans survive normalization`; `load does not overwrite existing keys`; `save writes only patch keys`; `concurrent density and theme saves both survive`; `reset touches only rfdm keys`; `subscribe ignores other storage areas and unrelated changes`; `read and write failures reject`.
- [ ] Assert `normalize({enabled:'true', theme:'sepia', fontSize:17}).enabled === false`, `.theme === 'system'`, `.fontSize === 16`. Assert the whole empty normalization equals the spec defaults. Save rejects invalid patches rather than silently claiming they were saved; normalize is tolerant of corrupt stored data.
- [ ] Run `node --test themeSettings.test.js`; confirm expected failures.
- [ ] Implement the schema and Chrome/Firefox-compatible storage calls using APIs available at the declared floors. Do not write defaults on every load. Maintain normalized subscriber state by merging event keys; register the listener before loading and replay intervening changes so a late read cannot erase a newer change. Missing schema version is v1; a newer unknown version falls back safely without rewriting data.
- [ ] Run `node --test themeSettings.test.js` and `npm run lint`. Confirm no host, tabs, scripting or unlimitedStorage permission was added.

**Acceptance:** Appearance works offline and is isolated from config URL/rule data. An upgrade does not activate appearance or reset any existing configuration.

## Task 3: Add a reversible appearance lifecycle

**Files:** Create `js/theme/dom.js`, `js/theme/controller.js`, initial `css/forum-theme.css`, `themeController.test.js`; modify `manifest.json`.

**Interfaces:** Produces journal/controller APIs and a `{type:'getThemeStatus'}` runtime message returning `ThemeStatus`. Keep the existing `{type:'getActivity'}` route untouched. Theme message listener responds only to its own type.

- [ ] Write tests: `native until storage and DOM ready`; `unknown pages receive no root flags`; `settings failure retains native page`; `enabling then disabling removes only owned mutations`; `ten toggles create one recovery control`; `system theme follows matchMedia`; `explicit theme ignores OS changes`; `does not write native data-theme or cookie`; `late read cannot override disabled change`; `adapter exception restores native presentation`; `cleanup leaves unrelated site mutations intact`.
- [ ] Journal assertions: capture an original attribute value, apply an owned value, restore the original only if current value still equals the last owned value. Never delete a site-owned node. Prune detached element entries so an endless stream of replaced posts is not retained. Injected controls carry `data-rfdm-owned="true"`.
- [ ] Run `node --test themeController.test.js`; confirm failing assertions.
- [ ] Implement readiness from `document_start`, waiting for `documentElement`/DOMContentLoaded as necessary. Start settings subscription before initial load; order updates so a late load cannot overwrite a newer event. Call `detect` after DOM readiness. On success, resolve OS theme and set `data-rfdm-enabled`, `data-rfdm-page`, `data-rfdm-theme`, `data-rfdm-density`, `data-rfdm-font-size`, `data-rfdm-width`, `data-rfdm-hide-promotions`, `data-rfdm-hide-signatures`, `data-rfdm-compact-profiles` on html. Own only these names.
- [ ] Implement independent runtime error boundaries. Recognition/storage/adapter failure means restore appearance, retain a reason in status, and leave the cleaner alone. Settings changes can retry; no polling retry loop. On off, restore markers and remove recovery button immediately; retain the lightweight storage/message subscriptions needed to re-enable. Returned cleanup also removes those subscriptions and media/readiness listeners.
- [ ] Add the recovery button with `type="button"`, text “Original view”, a keyboard focus indicator, and handler `settings.save({enabled:false})`. Disable the local controller immediately on click; if persistence fails, stay native for this document and show an inline save error. Do not claim other tabs were disabled if saving failed. Place without replacing the native toolbar; use body fallback if necessary.
- [ ] Add theme script entry ordered `settings.js`, `dom.js`, `adapters.js`, `controller.js` with `run_at: document_start` and `css/forum-theme.css`. Insert list/thread modules before controller as their tasks land. Preserve the cleaner entry and its timing. Controller gracefully skips optional adapters until present.
- [ ] Implement base tokens from the spec with all rendering rules under `@media screen` and enabled/page gates. Set color-scheme only while enabled. No unscoped reset, body hiding or native attribute overwrites. Keep extension controls hidden in print.
- [ ] Run `node --test themeSettings.test.js themeAdapters.test.js themeController.test.js content.test.js`; require pass, then `npm run lint`.

**Acceptance:** Disabled mode changes no host appearance; toggling is immediate and reversible, including when RFD's native dark mode is active. Link cleaning remains operational during a theme failure.

## Task 4: Deliver the deal-list redesign and precise promotion cleanup

**Files:** Create `js/theme/list.js`, `themeList.test.js`; extend adapters, manifest ordering, CSS and list fixtures.

**Interfaces:** Produces `list.enhance(root, settings, journal)`. Mark verified elements with `data-rfdm-role`: `list`, `deal-row`, `deal-title`, `deal-meta`, `deal-thumbnail`, `promotion`, `promotional-sidebar`. One node has one role; assign the most specific needed role and scope CSS through its ancestors. Adapters may retain original class selectors inside their verified page roots for subparts that do not need markers.

- [ ] Write tests: `retains title anchor identity/href/order`; `missing price stays absent`; `preserves expired pinned unread and locked status`; `promotion wrapper never includes an organic deal`; `ad-like text in a title is not hidden`; `repeated enhancement is idempotent`; `new row itself and nested inserted rows are marked`; `unknown row stays untouched`.
- [ ] Assert native anchors are `===` their pre-enhancement references; original link event listener still fires; row count and order are unchanged in DOM; only verified promotion wrapper receives the promotion marker. Hidden placement remains in DOM for restoration.
- [ ] Run `node --test themeList.test.js`; confirm failures.
- [ ] Implement verified row classification and markers. Sponsored anchors in the observed HTML require checking their own dedicated placement wrapper before hiding. If uncertain, retain the placement and its sponsored label. Do not remove labels to make sponsored material resemble organic deals.
- [ ] Implement list CSS using native hierarchy: thin row separators, fully wrapping 18 px titles, readable price/metadata, max 56 px thumbnails and specified width/padding. Compact hides only list thumbnails. Layout changes below 768 px; useful filters, native menus and pagination remain visible. Avoid CSS visual ordering that conflicts with keyboard/reading order.
- [ ] Implement `adapters.enhanceShell(document, match, journal)` for verified shell promotion slots and dedicated gap markers; call it from the controller on initial activation and after shell replacement for both list and thread pages. Keep this implementation in `adapters.js` with tests in `themeAdapters.test.js`. Mark verified shell promotion slots and recover dedicated gaps. Reclaim `#site_content` sidebar layout only when the inventory proves its remaining sidebar content is all promotional; otherwise retain the column or style remaining useful elements. Never hide the whole sidebar based on its tag/name.
- [ ] Run `node --test themeAdapters.test.js themeList.test.js themeController.test.js`; inspect fixture rendering in both themes before claiming visual acceptance.

**Acceptance:** The listing looks like a readable compact forum list. Navigation and source ordering are unchanged; turning promotion hiding off restores slots without rebuilding content.

## Task 5: Deliver readable threads and compact author details

**Files:** Create `js/theme/thread.js`, `themeThread.test.js`; extend manifest, adapters, CSS, thread fixtures.

**Interfaces:** Produces `thread.enhance(root, settings, journal)`. Roles: `post`, `post-body`, `profile-stats`, `signature`; use verified existing selectors within `post` for author, original-post treatment and actions. Apply shell promotion classification through shared adapter selectors, not a duplicate competing selector list.

- [ ] Write tests: `preserves body form attachment and action identity`; `keeps post IDs/permalinks`; `retains native quote/reply listeners`; `keeps username and staff/OP indicators visible`; `marks only verified profile statistics`; `does not confuse user text with signature`; `styles nested quotes without removing text`; `unknown inserted widget remains untouched`.
- [ ] Fixture contains nested quotes, a spoiler, image, wide table, long URL, code block, user-authored colors, deleted/ignored notice, synthetic editor with input value, labels and validation error. Assert text, form values, names/actions, links and IDs are identical after enhance/restore; clicking synthetic reply/quote actions still reaches their original handler.
- [ ] Run `node --test themeThread.test.js`; confirm failures.
- [ ] Implement reversible markers, including signatures only after obtaining verified markup. Keep uncertain signature layouts visible and record the unsupported variant; never hide the last paragraph or `<hr>` sibling as a heuristic.
- [ ] Add thread CSS: widths and 78ch/90ch text measures, 16/18/20 px post text at 1.65, 26 px title, 32 px avatar, compact profile statistics, original-post accent, local overflow for tables/code, `max-width:100%` and automatic image height. Keep post actions visible, native hidden states respected, and default images uncropped.
- [ ] Scope overrides to verified thread bodies and chrome. Do not use blanket `display:block` for native hidden controls or universal foreground overrides; preserve spoiler/ignored-content visibility semantics. Test composer toolbar, menus and modal layering in the browser gate.
- [ ] Run `node --test themeThread.test.js themeController.test.js content.test.js`.

**Acceptance:** Full discussion content is readable, user/staff status remains clear, and existing native post actions/composer work. No new collapse, quote parser or reply implementation is introduced.

## Task 6: Make appearance configurable through the popup

**Files:** Create `js/popupAppearance.js`, `popupAppearance.test.js`; modify `html/popup.html`, `css/popup.css`; adjust existing popup tests only if markup integration requires it.

**Interfaces:** The module binds to `appearance-form`, `modern-enabled`, `modern-theme`, `modern-density`, `modern-font-size`, `modern-content-width`, `modern-hide-promotions`, `modern-hide-signatures`, `modern-compact-profiles`, `appearance-reset`, `appearance-status`, `theme-page-status`. Use existing settings APIs and the separate theme status message.

- [ ] Write tests: `loads exact defaults`; `saves only changed key`; `appearance controls work on non-RFD tab`; `unsupported page explains native fallback`; `missing receiver suggests reload`; `failed save shows error and restores persisted value`; `reset does not change rule config`; `rapid same-control changes persist final choice`; `existing cleaner UI initializes if appearance load fails`.
- [ ] Run `node --test popupAppearance.test.js popup.test.js`; confirm new cases fail while existing tests pass before implementation.
- [ ] Add labeled controls with values matching Settings. Below master switch, disable dependent appearance fields while off but retain their stored values. Keep reset and page status available. Appearance settings save on change; serialize writes from this popup so rapid changes to the same key finish in input order. Storage events update controls across tabs/popups without triggering another save loop.
- [ ] Add live status messages: “Modern view is off.”, “Modern view is active on this page.”, “This page uses the original RFD layout.”, and “Reload this forum tab to apply the extension.” Choose from ThemeStatus/receiver availability, not guesses from missing activity. A non-RFD active tab must not prevent saving global appearance preferences.
- [ ] Render errors via textContent and preserve keyboard focus; avoid optimistic “Saved” before the write resolves. On failure, restore last confirmed state; if a newer change is queued, let it take precedence. Reset appearance affects only appearance. Preserve existing rule reset ID and semantics.
- [ ] Keep existing link count visible. Group existing tester and config controls in disclosures without changing their IDs. Put existing error/update status where a collapsed disclosure cannot silently hide a rules failure. Style popup with existing browser-following scheme; website theme selection affects forum pages only, with a short label/help explaining it.
- [ ] Run `node --test popupAppearance.test.js popup.test.js linkTester.test.js themeSettings.test.js`.

**Acceptance:** All settings work without reload in already-injected supported tabs, storage errors are visible, and every existing popup feature remains usable.

## Task 7: Validate dynamic content, rendering and browser behavior

**Files:** Extend controller and tests, add browser test/config files, manual checklist, Playwright dev dependency; modify package scripts and `.github/workflows/test.yaml`.

**Interfaces:** `npm run test:browser` runs Playwright against offline fixtures in Chromium and Firefox. `npm test` retains existing root Node test discovery. Browser fixture tests load packaged theme scripts/CSS with a mocked extension API; they do not imply validation of actual extension loading, which is a separate manual check.

- [ ] Add controller tests for mutation bursts (100 appended subtrees), root replacement, removal, repeated toggles, body readiness, media changes, pagehide/pageshow restoration and runtime invalidation. Assert one scheduled pass per burst, no duplicate recovery button, no whole-document scan for every insertion and no callbacks after full cleanup.
- [ ] Implement a childList/subtree observer on `document.documentElement` (so replacing the recognized root is visible) with a queued Set of added roots and one requestAnimationFrame batch; discard nested duplicate roots. Ignore owned control insertions. Do not observe your own data attributes. Journal pruning drops detached references each batch. Re-detect only if the recognized root disappears or a document-level structural replacement occurs; unknown replacement restores native layout. Do not patch history or add polling without evidence the site needs it.
- [ ] Add integration test `link cleaner survives theme startup failure`: load both real scripts with supported fake APIs, inject an eligible link, force adapter failure and assert the link is still cleaned and activity responds. Add `theme and cleaner converge after added post` and assert href is written once, markers settle and no observer feedback continues.
- [ ] Implement a controlled offline browser fixture route; load synthetic/sanitized HTML and a documented small host CSS fixture so specificity, hidden states and overflow are exercised. Block outbound requests in the harness. Use real deployed RFD CSS only in interactive local verification; do not commit a scraped stylesheet as original project code.
- [ ] Add Playwright dev dependency with lockfile, `test:browser` script and Chromium/Firefox projects. CI installs browsers via `npx playwright install --with-deps chromium firefox`, runs `npm run test:browser`, and uploads failure artifacts. Do not add E2E tests under the root `*.test.js` glob.
- [ ] Test both theme values across list/thread at widths 390, 768, 1440; test Compact at 390 and 1440 and 20 px text at 390. Assert no page-wide horizontal overflow, hidden promotions consume no layout space, post content remains visible, controls have accessible names and focus, and anchor destinations/IDs persist. Capture screenshots for human review, not just DOM assertions.
- [ ] Test native `data-theme` light/dark crossed with extension light/dark/system; mock OS changes. Check Original view removes extension presentation and a native styling sentinel is restored. Verify print emulation ignores theme styling/owned controls. Check forced colors and reduced motion avoid unusable focus/visibility.
- [ ] Run `npm test`, `npm run test:browser`, `npm run lint`. Record commands, counts, browser versions and any exclusions in the manual checklist.
- [ ] Load the actual unpacked extension in Chrome and Firefox on live RFD. Record before/after screenshots, native light/dark combinations, first paint, toggle restoration, actual extension storage messages and profiler results on a large thread. Target no repeated idle work; theme-attributable batches under 50 ms on a documented machine. If exceeded, split work and document the measured change. Do not assert a hardware-independent performance guarantee.
- [ ] Manual signed-in checks: open account menu, search/filter/sort, paginate, jump to post hash/back/forward, open editor, type draft and preview, invoke quote into draft, inspect edit/report/subscription/vote controls. Preserve drafts and avoid submitting posts, votes, reports or account changes without authorization. Where an action's end-to-end result cannot safely be checked, record that limitation and validate handlers in a local fixture.
- [ ] Check actual Firefox Android when available, or explicitly record it as unverified. Desktop emulation is not proof of Android support. Confirm 200% browser zoom, keyboard order, focus visibility and menu/modal usability manually. Treat unavailable authenticated/platform validation as an outstanding release gate, not a passed check.

**Acceptance:** Automated fixture checks and actual extension checks are reported separately. Fix failures in their owning task; do not weaken tests or expand broad hiding rules to make screenshots look clean.

## Task 8: Package, document and prepare the handoff for release

**Files:** Modify `README.md`, `CHANGELOG.md`, `package.json`, `.github/workflows/build.yaml`, `.github/workflows/publish.yaml`; update manual checklist and add approved screenshots under `docs/images/`.

**Interfaces:** Existing `npm run build` remains the distribution entry point. Both GitHub build and publish packaging paths apply the same exclusions.

- [ ] Document Modern view scope, opt-in default, settings, Original view recovery, cosmetic promotion hiding, unsupported templates and extension-only theming. Keep cleaner usage instructions accurate. Add before/after list/thread screenshots from a known sanitized or public page without private account data.
- [ ] Add an Unreleased changelog section. Keep current manifest version until a release version is deliberately chosen. Do not create a tag or submit to stores in this implementation task.
- [ ] Extend all package ignore paths to exclude `test/**`, `playwright.config.cjs`, `test-results/**`, `playwright-report/**`, root `*.test.js`, docs and existing artifacts. Ensure dev dependencies/`node_modules` and private working metadata are absent from archives; inspect the actual archive rather than relying only on ignore patterns. Preserve runtime `js/theme/**` and `css/forum-theme.css`.
- [ ] Add a packaging regression in `themeAdapters.test.js` or a dedicated `themePackage.test.js` if it is clearer: manifest references resolve; cleaner entry still ends at document_end; theme scripts are ordered and at document_start; storage is the only added permission. Do not enforce irrelevant whitespace/string matches.
- [ ] Run final `npm test`, `npm run test:browser`, `npm run lint`, `npm run build`; inspect the zip contents. Resolve newly introduced errors; distinguish existing warnings explicitly. Confirm userscript sources, redirect rules, extension IDs and native theme cookies are unchanged.
- [ ] Review diff for broad selectors, hidden real content, site-owned node deletion, accidental URL modification, remote assets, unnecessary permissions and unrelated changes. Use the requested execution workflow's review gate; do not claim independent review if none occurred.
- [ ] Summarize delivered files, supported templates, test results, outstanding release gates and remaining product assumptions. Commit coherent tasks only following the repository commit skill if commits are part of the implementation workflow; do not include unrelated pre-existing artifacts.

**Acceptance:** A locally buildable, opt-in extension with documented actual coverage. Publishing remains a separate action; unverified platform or authenticated cases stay visible in the release checklist.

## Milestones and stopping rules

| Milestone | Tasks | Reviewable result |
| --- | --- | --- |
| Contracts and lifecycle | 1–3 | Verified detection, persisted settings, reversible scoped shell |
| Modern reading | 4–5 | Deal-list and thread layouts with native behavior preserved |
| User control | 6 | Complete popup and instant settings changes |
| Release readiness | 7–8 | Browser evidence, regression protection and inspected package |

Execute sequentially. If context becomes tight, finish the current task, update its checkboxes and record exact files/commands/remaining failures before handing off. Do not silently implement later scope to fill gaps. If live DOM differs, update inventory and its fixtures before changing selectors. If access prevents verification, continue independent work and report the specific release gate that remains.

## Copy/paste prompt for GPT-6-sol

> Implement the Modern RFD plan in this repository. First read `docs/superpowers/specs/2026-09-26-modern-rfd-design.md` and `docs/superpowers/plans/2026-09-26-modern-rfd.md`, then inspect the current branch and repository instructions. I want the v1 scope described there: deal lists and threads, opt-in modern theming, reversible clutter reduction, existing RFD actions and affiliate cleaning preserved. Use the documented defaults and execute tasks inline in order. Update task checkboxes with actual evidence. Do not redesign the architecture or add unrelated features. Verify actual DOM selectors, use offline fixtures for automated tests, and distinguish fixture tests from live browser/authenticated checks. Preserve pre-existing work. Complete all independently possible implementation and validation; report inaccessible checks as release gates. Do not publish, tag a release or submit live forum actions.
