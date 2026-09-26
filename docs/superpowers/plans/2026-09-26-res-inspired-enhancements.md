# RES-Inspired Forum Enhancements Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement selected tasks. Use `superpowers:subagent-driven-development` only when delegation is explicitly selected. Steps use checkboxes for tracking. Do not implement the entire backlog unless requested.

**Goal:** Improve native RFD browsing with independent controls, reading continuity, personal filters, user notes, remembered collapsing, and portable settings.

**Architecture:** Extend the current reversible DOM enhancement system with small feature modules and shared RFD data adapters. Keep preferences and personal data in extension storage. Preserve native forum actions and use RES as a design reference, implementing RFD-specific code.

**Tech stack:** Manifest V3, vanilla JavaScript and CSS, Chrome/Firefox extension APIs, existing Node/jsdom and Playwright checks. No new runtime framework required.

**Spec:** The product brief below records the conversation's scope; technical defaults are proposals for incremental implementation. Existing appearance requirements remain in [the Modern RFD design](../specs/2026-09-26-modern-rfd-design.md).

**Status:** Planning only. All tasks are unstarted. Baseline: `codex/modern-rfd`, commit `e645cc4`. Recheck the branch and files before implementation.

## Product brief

- rfd-fyi remains a separate product for standalone deal discovery. No migration, deprecation, shared backend, or replacement dashboard is part of this plan.
- This extension improves native lists and discussions. It should feel quieter and more useful without adding a toolbar full of controls.
- Appearance, clutter removal, personal filtering, and reading features should be independently switchable. Existing link cleaning stays independent.
- Start with independent modules and reading continuity. Ship the remaining features as separate increments.
- New personal-data features default off until enabled. Existing appearance and link-cleaning defaults remain on. Preserve existing user choices during upgrades.
- Settings belong in the popup or a dedicated settings page. Inline controls must relate to the item being acted on and fit its native action area. Do not restore the removed Original view button.

## Global constraints

- Keep the extension named `rfd-enhancement-suite`.
- Current manifest floors: Chrome 121, Firefox desktop 112, Firefox Android 113. Do not silently use newer APIs or raise those floors.
- Preserve native timestamps, avatar and emoji sizing, author metadata, voting, quoting, pagination, and permalinks.
- Support verified card/classic list and thread templates. Unknown markup must fail open: keep content visible and native actions usable.
- Never infer sponsorship solely from merchant names or title keywords; keep using explicit site markers.
- Store personal state locally. No telemetry, remote model, cloud sync, or background crawling is needed.
- Disabling a module restores its own presentation without clearing personal data or undoing another module's changes.
- Do not copy RES implementation code into the MIT project without a separate GPLv3 licensing decision.
- Feature work does not authorize store publication, a version tag, or deployment.

## Review focus

1. Existing users with Modern view off must not unexpectedly acquire hidden content after migration (Task 1).
2. Dynamically replaced rows/posts must be enhanced once, without stale state or duplicate handlers (Tasks 2–3).
3. Opening a thread is not proof that every reply was read; viewport progress and reply-count baselines have different meanings (Tasks 4–5).
4. Missing metadata, edited titles, or a renamed member must not hide the wrong content or attach notes to the wrong person (Tasks 6–8).
5. Concurrent tabs, malformed backups, and failed storage writes must not silently erase personal data (Tasks 4, 8–10).

## Milestones and task selection

| Milestone | Tasks | Deliverable | Dependencies |
| --- | --- | --- | --- |
| A — Independent controls | 1–3 | Cleanup works without theming; shared module lifecycle | Existing extension |
| B — Reading continuity | 4–5 | Resume reading; replies since last visit | A |
| C — Personal filters | 6–7 | Hide/highlight rules with clear recovery | A |
| D — User notes | 8 | Private labels and notes | Tasks 2–3, 6 |
| E — Remembered collapsing | 9 | Optional post and quote collapsing | A; reuse Task 4 storage conventions |
| F — Portable data | 10 | Validated export/import | Implemented modules only |

Milestones C–F can be selected separately after their dependencies. Backup may ship earlier for the modules available at that time. Each numbered task should end in a usable, reviewable change.

## Task 1 — Separate cleanup from Modern view

**Files:** Modify `js/theme/settings.js`, `js/theme/controller.js`, `css/forum-theme.css`, `html/popup.html`, `js/popupAppearance.js`; create `css/forum-cleanup.css`; register CSS in `manifest.json`. Update `themeSettings.test.js`, `themeController.test.js`, `popupAppearance.test.js` as needed.

**Interface:** Retain `rfdm.enabled` for appearance. Add boolean `rfdm.cleanupEnabled`; retain existing cleanup preferences `hidePromotions`, `hideSidebar`, and `hideSignatures`. Author-stat compaction remains an appearance preference.

- [ ] Add an idempotent settings migration: on existing installs, initialize a missing cleanup switch from the saved appearance switch (default true). New installs default cleanup on. Never overwrite an explicitly saved cleanup choice; persist the migration before treating it as complete.
- [ ] Decouple cleanup CSS gates and lifecycle from `data-rfdm-enabled`. Theme-off must remove theme styling while allowing enabled cleanup rules to operate.
- [ ] Move sidebar width restoration into cleanup so hiding a sidebar also reclaims its column in native styling. Keep general theme gutters controlled by appearance.
- [ ] Group popup controls into Appearance and Cleanup. Turning appearance off disables only appearance-dependent controls; clarify reset scope.
- [ ] Check all four appearance/cleanup combinations, migration from saved false, repeated upgrades, and restoration on classic lists/cards/threads.
- [ ] Update README and changelog; record live Brave results before calling visual behaviour verified.

**Done when:** A user can hide sponsored threads/sidebar with native styling, and turning cleanup off restores them.

## Task 2 — Normalize thread, post, and author metadata

**Files:** Create `js/forum/model.js`; modify `js/theme/adapters.js`, `manifest.json`; add sanitized cases to `test/fixtures/rfd/` and focused `forumModel.test.js`.

**Interfaces:** Expose `RFDModern.forum.readThread(row)`, `readPost(article)`, `readPage(document, url)`, and `readAuthor(link)`; return a validated record or `null` for unsupported content.

- Thread: `{ id, element, url, title, retailerId, retailerName, authorId, score, replyCount, sponsored }`.
- Post: `{ id, threadId, element, bodyElement, permalink, authorId, position }`.
- Page: `{ kind, root, threadId, canonicalUrl, pageUrl, replyCount }`.
- Author: `{ id, name, profileUrl }`.
- IDs are strings; unavailable fields are `null`, including unknown sponsorship. `position` is a verified native post number, never guessed from DOM index. `pageUrl` preserves pagination; canonical URL identifies the thread.

- [ ] Inspect live classic/card/thread markup before choosing selectors; record verified variants in `docs/testing/rfd-dom-inventory.md`.
- [ ] Extract IDs from explicit attributes or validated native URLs. Use numeric member ID when available; do not use displayed names as durable identity.
- [ ] Keep extraction read-only and independent of styling. Missing score must remain unknown, never become zero.
- [ ] Check equivalent records across layouts, malformed links, missing fields, quoted usernames, and genuine author links.

**Done when:** Features can consume the same records across supported templates without maintaining their own selector collections.

## Task 3 — Introduce a small reversible module lifecycle

**Files:** Create `js/features/registry.js`; modify `js/theme/controller.js`, `js/theme/dom.js`, `js/theme/bootstrap.js`, `manifest.json`; update `themeDynamic.test.js` and `themeController.test.js`.

**Interface:** `register({ id, supports(page), enabled(settings), mount(context) })`; `mount` returns `{ update(settings), enhance(root), dispose() }`. Context supplies `{ document, window, page, settings, journal }`. Each module gets its own journal.

- [ ] Adapt appearance and cleanup into this lifecycle without rewriting their rendering. Keep the existing cleaner lifecycle unless a concrete integration need arises.
- [ ] Route relevant additions/replacements through one feature observer; deduplicate nested mutation roots within each batch. Added title/badge children must cause their containing row to be reconsidered.
- [ ] Implement explicit disposal for listeners, observers, scheduled callbacks, owned nodes, and styles. Re-enable starts a fresh lifecycle; a permanent WeakSet must not prevent it.
- [ ] Recover when the supported root is replaced and when supported content arrives after startup. One module failing must not disable the others.
- [ ] Check repeated toggles, module isolation, delayed content, root replacement, and listener duplication.

**Done when:** A small new module can be enabled and removed without altering the theme controller's feature-specific branches.

## Task 4 — Remember reading position and offer Resume

**Files:** Create `js/features/reading.js`, `js/data/readingStore.js`, `js/background/readingMessages.js`, `reading.test.js`; modify `js/background.js`, settings/popup wiring, manifest and fixture/browser coverage.

**Interfaces:** `readingStore.get(threadId)`, `recordProgress({ threadId, postId, position, pageUrl, observedAt })`, `clear(threadId)`. Store under `rfdm.reading.<threadId>` with schema version and update time. Register a validated background message handler to serialize read/merge/write operations per thread; restrict sender origin to supported extension/RFD contexts.

- [ ] Add an off-by-default **Remember reading position** setting. Do not record in private browsing in this increment.
- [ ] Qualify a post after its body has at least `min(120px, body height)` visible for one continuous second in a visible tab. Cancel pending qualification on hiding the tab, hiding the post, or disposal. This is a progress heuristic, not proof of reading every post.
- [ ] Batch persistence, reject malformed records, and prune records older than 90 days and beyond 2,000 threads by oldest update time. Never require a final unload write for correctness.
- [ ] Merge verified positions monotonically across tabs. Without comparable positions, accept the newest observation as a last-observed location; do not claim it is the furthest read post.
- [ ] Put **Resume reading** beside native thread navigation when prior progress exists. Navigate only after a click, using the stored page URL/permalink. Respect explicit incoming post anchors. Offer a scoped reset in settings.
- [ ] Check tall posts, short posts, hidden tabs, filtered/collapsed posts, two concurrent tabs, missing stored targets, storage failure, and module off.

**Done when:** Revisiting a discussion offers a useful resume link without scrolling the user unexpectedly or marking the entire discussion read.

## Task 5 — Show replies since the last visit

**Files:** Create `js/features/newReplies.js`, `newReplies.test.js`; extend `js/data/readingStore.js` and background message validation; wire a separate setting.

**Interfaces:** `recordVisit({ threadId, replyCount, visitedAt })` merges `{ lastVisitReplyCount, lastVisitedAt }` into the existing thread record without overwriting progress.

- [ ] Add off-by-default **Show replies since last visit**. Track only when enabled and outside private browsing.
- [ ] Record a verified total reply count on a visible thread visit. Refresh that baseline when the user returns focus to the thread and a newer native count is available; reject older concurrent visit events.
- [ ] On a list, display `N since last visit` only when both counts are known and `N = current - baseline` is positive. No baseline or missing count means no badge; deleted replies must not produce a negative badge.
- [ ] Reevaluate on relevant row changes and storage changes. Preserve native new-post links and timestamps.
- [ ] Check first visit, missing counts, deletions, concurrent visits, and background-opened threads. Document that this is count change, not an exact unread count.

**Done when:** Lists provide useful activity context without implying that opening a thread means every reply was read.

## Task 6 — Add a settings page and personal thread filters

**Files:** Create `html/settings.html`, `css/settings.css`, `js/settingsPage.js`, `js/features/filters.js`, `js/data/filterRules.js`, `filterRules.test.js`; modify manifest `options_ui`, popup navigation, settings, and fixtures.

**Interfaces:** `validateRule(raw) -> Rule | error`; `evaluateRules(thread, rules) -> { hidden, highlighted, ruleIds }`. A rule has `{ id, enabled, field, operator, value, action }`. Fields: `title`, `retailer`, `authorId`, `score`; actions: `hide`, `highlight`. Literal title/retailer matching is case-insensitive; author IDs match exactly; score supports numeric comparisons. Each rule stands alone, with any matching hide rule taking precedence over highlight.

- [ ] Add an off-by-default personal-filter module and an empty rule list. Store rules under `rfdm.filters.rules`.
- [ ] Provide add/edit/remove/enable controls on the settings page and a **Manage filters** link in the popup. Keep arbitrary regex and nested Boolean builders out of this first increment.
- [ ] Match verified retailer IDs when a rule was created from one; otherwise use normalized retailer names. Unknown metadata does not match a rule requiring it.
- [ ] Hide through extension-owned attributes/classes; never remove the native row. Highlight without replacing title contents. Preserve native hidden states.
- [ ] Reevaluate edited rows and rule changes. Check hide/highlight conflicts, unknown score, retailer case variation, renamed authors with stable IDs, and filter-off restoration.
- [ ] Label this feature as filtering loaded forum content; it does not search unseen pages or reorder the forum.

**Done when:** Personal rules work on both supported list layouts independently of appearance.

## Task 7 — Make filtering explainable and reversible

**Files:** Extend `js/features/filters.js`, settings/popup status, cleanup CSS, and relevant fixture/browser checks.

**Interface:** Extend status reporting with `{ hiddenThreadCount, matchedRuleIds }`; maintain an ephemeral per-tab reveal state, not a persisted rule edit.

- [ ] Report how many loaded threads personal filters hid and provide **Show filtered threads** in the popup; use a compact local recovery control if a list otherwise becomes empty.
- [ ] In reveal mode, provide an accessible reason and a route to edit the matching rule. Avoid displaying large controls inside each ordinary row.
- [ ] Reveal only content hidden by personal filters. Content hidden by RFD, cleanup sponsorship rules, or another module must remain governed by its own controls.
- [ ] Ensure keyboard focus moves sensibly if a focused row becomes hidden. Check all-rows-hidden and overlapping module rules.

**Done when:** Users can explain and temporarily reverse filtering without deleting their preferences.

## Task 8 — Private user labels and notes

**Files:** Create `js/features/userNotes.js`, `js/data/userNotesStore.js`, `userNotes.test.js`; extend settings page, manifest, and native author fixtures.

**Interfaces:** `get(userId)`, `save(userId, { label, note, color, sourceUrl, updatedAt })`, `remove(userId)` under `rfdm.userNote.<userId>`. Label limit 60 characters; note limit 2,000; colour from a fixed accessible palette. Source URL is optional and limited to validated HTTP(S).

- [ ] Add an off-by-default **User notes** module. Use verified member IDs; if identity cannot be established, omit the control.
- [ ] Show a small note control beside actual author identity, leaving rank, OP/staff badges, avatar, location, and statistics intact. Render user text with textContent.
- [ ] Add a searchable note manager and per-user delete. Detect a newer stored record while an editor is open and ask the user to reload or explicitly overwrite it rather than silently losing edits.
- [ ] Notes are private labels, not reputational scores or automatic public actions. Do not add an icon to every username inside quoted text.
- [ ] Check member renaming, repeated appearances, HTML-like note text, long labels, conflicting edits, storage failure, and module disposal.

**Done when:** A note follows the same member across supported pages and survives reloads without changing native profile information.

## Task 9 — Remember collapsed posts; optionally shorten long quotes

**Files:** Create `js/features/collapse.js`, `js/data/collapseStore.js`, `collapse.test.js`; extend feature CSS, settings, manifest, and rich-thread fixtures.

**Interfaces:** Persist explicit post decisions by `{ threadId, postId, collapsed, updatedAt }` using keys `rfdm.collapse.<threadId>.<postId>`. Use the same 90-day/2,000-thread retention policy as reading data.

- [ ] Add separate off-by-default controls for **Remember collapsed posts** and **Shorten long quotes**.
- [ ] Collapse only the post body, keeping author, timestamp, permalink, and expand control accessible. Do not persist automatic collapsing as a user decision.
- [ ] Provide keyboard-operable controls with aria-expanded and aria-controls; preserve native reply/quote actions. Explicit post-anchor navigation reveals its target for that visit without deleting a saved preference.
- [ ] Initially shorten quoted blocks taller than 240 CSS pixels with a reversible **Show full quote** control. Do not alter the quote's HTML or apply the rule to avatars, emoji, attachments, or other images.
- [ ] Keep quote expansion local to the current page; stable quote IDs are not assumed. Skip automatic shortening when measurement is unavailable.
- [ ] Check nested quotes, lazy-loaded content, links inside quotes, explicit anchors, collapse/reading interactions, and feature-off restoration.

**Done when:** Long discussions can be compacted while preserving navigation and recoverable content.

## Task 10 — Export, preview, and import personal data

**Files:** Create `js/data/backup.js`, `backup.test.js`; extend settings page and implemented data stores. Update README and changelog.

**Interfaces:** `exportData(selection) -> { format: 'rfd-enhancement-suite', version: 1, exportedAt, settings, filters?, reading?, userNotes?, collapsedPosts? }`; `validateImport(raw) -> { preview, normalized } | error`. Include only selected, implemented sections.

- [ ] Offer settings/rules export and separately opt-in personal history/notes export. Explain which sections are included.
- [ ] Accept at most 5 MB of JSON; validate the envelope, known fields, each nested record, IDs, bounds, timestamps, and URLs. Reject unknown future versions before writes. Never import redirect configuration, cached rules, or arbitrary storage keys through this format.
- [ ] Preview counts and affected settings. Support merge and replace for selected sections only; keep unrelated settings/data intact.
- [ ] Validate everything before applying changes. Preserve a rollback snapshot; use a journaled import operation that can recover from interrupted multi-key writes, and report success only after completion.
- [ ] Prune imported reading/collapse data using existing retention rules. Resolve duplicate IDs explicitly and preserve original rule IDs on replacement.
- [ ] Check malformed nested JSON, oversized input, unsupported versions, merge conflicts, partial-write recovery, and a real export/import round trip.

**Done when:** Users can move their chosen suite data between installations without losing unrelated state.

## Verification and completion routine

For each selected task:

- [ ] Start by inspecting the current code, branch state, and any applicable AGENTS.md. Confirm prerequisites are complete.
- [ ] Add or adapt meaningful tests for state transitions, migration/data integrity, and DOM behaviour; do not write tests that merely repeat constants or implementation details.
- [ ] Run affected Node tests explicitly, for example `node --test themeSettings.test.js themeController.test.js popupAppearance.test.js` for Task 1. New named test files above use the same command pattern.
- [ ] Run `npm run lint`; run `npm run build` when manifest, loading order, assets, or packaging changes.
- [ ] For DOM/CSS changes, run relevant Playwright coverage and inspect the actual extension in Brave and Firefox. Record platform limitations honestly; fixture checks alone do not establish live-site parity.
- [ ] Exercise classic lists, card lists, threads, theme off, feature off, and dynamic content where affected. Preserve the timestamp/avatar/emoji regressions already encountered in this project.
- [ ] Update docs/changelog for shipped behaviour, review the diff, and commit the completed increment with a concise Conventional Commit.
- [ ] Mark only completed checklist items; add the commit and verification evidence to the progress log below.

Do not repeat a broad test suite without a change or unresolved concern that warrants it. Do not automatically release or begin the next milestone after finishing the selected work.

## Progress log

| Date | Task | Commit | Verification / remaining limits |
| --- | --- | --- | --- |
| 2026-09-26 | Planning | — | Roadmap created; no feature implementation started |

## Deferred ideas

- Arbitrary regex filters, nested conditions, per-forum rules, and filtering post bodies.
- Keyboard navigation, saved posts, and optional read-post collapsing.
- Cloud sync, cross-device reading history, background alerts, and remote enrichment.
- Infinite scrolling, media host expansion, dashboards, and any rfd-fyi consolidation.

## RES references

Use the inspected commit `4defffc12235b86b50e458d9f3565c96376609ec` for reproducible research:

- [Module contracts](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/core/module.js) and [shared watchers](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/utils/watchers.js).
- [Read tracking](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/readComments.js) and [reply-count tracking](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/newCommentCount.js).
- [Filtering](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/filteReddit.js), [user tags](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/userTagger.js), [collapse persistence](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/commentHidePersistor.js), and [backup format](https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/4defffc12235b86b50e458d9f3565c96376609ec/lib/modules/backupAndRestore/serialization.js).
