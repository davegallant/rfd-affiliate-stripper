# Modern RFD: design brief

Date: 2026-09-26. Status: proposed design for implementation handoff; no product implementation in this planning task.

## Intent and scope

Expand this extension into a calmer, modern interface for RedFlagDeals while retaining its affiliate-link cleaning. The user requested inspiration from Modern for Hacker News and explicitly selected **deal lists and discussion threads first**. Success means scanning deals and reading conversations with less visual clutter, while existing forum workflows remain usable.

Assumptions selected for this handoff: retain the extension identity and store IDs; ship appearance on by default with a persistent off switch; prioritize desktop with responsive narrow layouts; retain native navigation, ordering, pagination and posting behavior. The user later explicitly chose the name `rfd-enhancement-suite`, default-on appearance and an off switch for link-cleaning-only use; other defaults are recommendations. The plan is ready to review and hand off without a separate implementation design interview.

## Evidence and limits

Repository inspected at `7cde540`; manifest version `0.8.1`. Existing untracked `.DS_Store`, `docs/superpowers/` content and `web-ext-artifacts/` predate this plan. Preserve them.

- `manifest.json`: MV3; one RFD-only content-script entry at `document_end`; Firefox desktop 112+, Firefox Android 113+, Chrome 121+; only `alarms` permission.
- `js/content.js`: cleans `a.postlink, a.autolinker_link`, observes inserted links and href/class changes, serves page-local activity. `js/background.js` and `js/utils.js` manage redirect rules in IndexedDB.
- `html/popup.html`, `js/popup.js`, `css/popup.css`: activity, link tester, rule configuration and browser-following colors.
- Plain JavaScript, no runtime framework or bundler. Tests use `node:test`, VM contexts and simple DOM doubles. CI uses Node 24 and web-ext.
- Userscript generation is independent, from `script.js.tmpl`; theming is extension-only in this release.

[Modern for HN](https://www.modernhn.com/) describes an extension applied to existing pages, adjustable appearance and a quick switch to the original design. Those principles inform this proposal; its other features and assets are not requirements.

Public HTML fetched successfully on 2026-09-26 from [Hot Deals](https://forums.redflagdeals.com/hot-deals-f9/) and [a sample discussion](https://forums.redflagdeals.com/rabbit-aviator-hat-20-2827128/). Browser rendering and signed-in interactions were **not** inspected: no browser automation surface was available. The web text fetcher failed for RFD, but direct HTTP fetched both pages. Selector observations below are evidence from HTML, not claims of visually validated behavior.

| Surface | Observed markup | Implication |
| --- | --- | --- |
| Site shell | `#site_content.with_sidebar`, `#partition_forums` | Existing width/sidebar rules will need scoped overrides. |
| Deal list | `#forum-topics`, `.topic-card.topic`, `.thread_main`, `.thread_info_block`, `.thread_title` | Card layout can be flattened using native elements. |
| List link/metadata | `a.topic-card-info.thread_info`, `.dealer_name`, `.savings`, `.votes`, `.posts`, `.topic_time` | Keep the original destination and metadata. Do not reconstruct titles or prices. |
| Thread | `article#thread.thread_details`, `article.thread_post[id]`, `.thread_original_post` | Recognize discussion pages structurally. |
| Post | `.post_body`, `.post_content`, `.content`, `.post_dateline`, `.dateline_permalink` | Retain bodies, anchors and timestamps. |
| Profile/actions | `.post_profilearea`, `.postprofile`, `.profile_username`, `.profile_rank`, `.profile_datejoined`, `.profile_numposts`, `.profile_upvotes`, `.post_actions_primary` | Compact statistics without losing identity or actions. |
| Promotions | `.ad_box`, `.ad_sponsored_deal`, `.sponsored-offer`, leaderboard and sidebar ad IDs | Require precise wrapper mapping; a sponsored marker can be on a nested anchor. |
| Native theme | Script sets `html[data-theme="dark"]` from `rfd_dark_mode` cookie | Own only `data-rfdm-*` attributes; never modify the cookie or native theme attribute. |

These selectors are starting evidence. DOM ancestry, classic-list variants, signatures, empty lists and authenticated forms require fixtures and interactive inspection before their adapters are accepted. Never infer a broad selector from its name alone.

## Architecture choice

| Approach | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Scoped CSS plus small DOM enhancements | Preserves native content, handlers and sessions; fits this repo | Must maintain site selectors and specificity | **Use for v1.** |
| Extract data and render a replacement app | Full control over markup | Reimplements actions, forms and state; harder recovery | Defer unless concrete limitations justify it. |
| Separate RFD client/site | Independent design and navigation | New hosting, data/auth dependencies and product scope | Outside this extension expansion. |

The extension owns presentation. RFD owns content, authentication, search, sorting, pagination, voting, subscriptions and posting. Keep existing element identity; do not clone or replace post bodies, action buttons, forms or list anchors. Use CSS grid/flex and small, reversible markers. Do not build a virtual DOM, fetch forum pages in the background, replace navigation with an SPA, or introduce a backend.

## First-release experience

### Deal lists

Use a centered, compact list with thin separators, generous title space and restrained metadata. The title and retailer carry the hierarchy. Keep price/discount when supplied, score, replies, time, unread/read indicators, pinned/locked/expired labels, filters, sort controls, pagination, thread menus and new-deal actions. Missing data is omitted; never invent a price or map missing votes to zero.

Convert the observed card layout into rows without changing source ordering. Keep original title link semantics, including middle-click, modifier-click and context menus. Existing thumbnails become at most 56 px square on desktop; suppress only the list thumbnail in compact density. Do not hide images inside posts. Long titles wrap fully.

At widths below 768 px, stack metadata under the title and let the native toolbar wrap. Do not force a wide score/title/replies table onto a phone. Keep native classic-list presentation as fallback until a separate verified adapter supports it; card mode is the first implemented variant.

### Discussion threads

Use a readable centered column, clear separation between posts and understated author metadata. The original deal remains visually prominent through its title and a subtle border/accent. Present author identity, OP/staff indicators, post number, permalink, timestamp, votes and all native actions. Reduce the width and visual weight of profile panels through styles rather than moving their children.

Preserve chronological ordering, original URL/hash targets, pagination, quote links, attachments, images, video, spoilers, deleted/ignored notices, edit markers and moderation information. Keep the native reply composer and its validation. Thread search and subscription controls stay reachable. Do not implement nested comment threads: RFD's quote relationships do not change its flat conversation model.

Long text wraps; images fit the content width without cropping; preformatted text and wide tables scroll within their own container. Quotes use a subtle border and surface; do not truncate or collapse quote bodies in v1. Avoid changing user-authored text/background colors indiscriminately; check BBCode combinations for readability in both themes.

### What gets quieter

| Content | Default when Modern view is enabled | Recovery |
| --- | --- | --- |
| Verified ad containers and sponsored placements | Hidden, including their dedicated empty space | Turn off “Hide promotions”. |
| Verified promotional sidebar modules | Hidden; reclaim the column only if no useful widget remains | Turn off “Hide promotions”. |
| Signature blocks | Hidden only for verified signature selectors | Turn off “Hide signatures”. |
| Join date, post-count and reputation statistics | Hidden with compact profiles | Turn off “Compact author details”. |
| Author name, avatar, OP/staff/banned status | Visible; avatar max 32 px | Always retain identity/status. |
| Native header/navigation | Compact spacing and type | Keep account/search/forum links. |
| Alerts, moderation notices, consent dialogs, authentication, errors | Visible and operable | Never classify as clutter. |
| User post content, deal caveats, prices and expiration notices | Visible in full | Never classify as clutter. |

Hiding ads is cosmetic; this feature does not promise to block ad/tracker requests. Avoid generic selectors such as `[class*="ad"]`, `.banner`, `aside`, `.badge` or all iframes. Do not hide an ancestor that contains organic posts or useful navigation. Do not remove scripts or neutralize site behavior.

### Appearance controls

Place “Modern view” first in the popup. Show controls with explicit labels and native form elements:

- Modern view: on by default for both new and existing installations in the initial release.
- Theme: System (default), Light, Dark.
- Density: Comfortable (default), Compact.
- Text size: 16 (default), 18, 20 px for post bodies.
- Content width: Standard (default), Wide.
- Hide promotions: on by default when Modern view is enabled.
- Hide signatures: on by default when Modern view is enabled.
- Compact author details: on by default when Modern view is enabled.

Settings persist locally and apply to all open supported forum tabs without reload. When Modern view is off, keep the selections for next time. Keep existing activity visible; place the tester and rule URL controls under “Link tools” / “Advanced” disclosures without losing their status messages. Add “Reset appearance”; it restores only appearance defaults. Existing config reset continues to reset only the rules URL.

Use a small extension-owned “Original view” button near the supported page's existing toolbar; it sets Modern view off globally. The popup switch re-enables it. This button must remain accessible if the host toolbar layout changes; a document-body fallback is acceptable. Removing theming immediately restores native appearance while the link cleaner keeps working. Clearly state this in help copy: “Appearance changes only. Link cleaning stays active.”

## Visual specification

A quiet utility interface: system font, neutral backgrounds, thin dividers, modest corner radii, limited red for identity/focus, blue for links. Avoid large cards, decorative gradients, shadows on every row and oversized marketing headers. These values are proposed design tokens, not measurements of either reference site.

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#f6f7f9` | `#111317` |
| Surface | `#ffffff` | `#191d23` |
| Text | `#20242c` | `#edf0f5` |
| Muted text | `#596273` | `#aab3c2` |
| Border | `#d9dee7` | `#343c49` |
| Link | `#075cc9` | `#82b8ff` |
| Accent | `#b42332` | `#ff8993` |

Use `--rfdm-*` custom properties. System font stack `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Post text 16/18/20 px with line-height 1.65; title 18 px on lists and 26 px on threads; metadata 13 px minimum. Standard outer width 1120 px/list and 920 px/thread; Wide 1360 px/list and 1120 px/thread. Text body maximum 78ch Standard and 90ch Wide, bounded by its available width. Gutters 24 px desktop, 12 px below 768 px. Row vertical padding 14 px Comfortable, 8 px Compact; no fixed row height. Border radius 6 px, spacing scale 4/8/12/16/24/32 px.

Interactive hit targets at least 32×32 px desktop and 44×44 px on coarse pointers, including Compact density. Visible 2 px focus outline with 2 px offset. Validate normal text contrast >=4.5:1 and relevant non-text controls >=3:1; do not assume the token table proves every composition. No essential information relies on color. Support 200% zoom, keyboard use and reduced motion; no new layout animation is required. Print styles restore native layout and omit injected controls, even with Modern view enabled.

Conceptual structure (native DOM order remains authoritative):

```text
Compact native header: RFD | Forums | Search | Account
Breadcrumb / forum name                  Original view
Native filters + sort + new deal          Pagination
------------------------------------------------------
Retailer / full deal title               Votes / replies
Price if supplied · time · status
------------------------------------------------------

Thread title + native deal details / voting
Native thread actions + pagination       Original view
------------------------------------------------------
Author · OP/staff · time · permalink
Full original post body, images, quotes, attachments
Native reply / quote / vote / report / edit actions
------------------------------------------------------
Next post …
Native composer + pagination
```

## Technical contracts

- Preserve the current runtime stack: vanilla JavaScript and CSS, no runtime dependencies, no bundler.
- Preserve browser floors: Chrome 121, Firefox desktop 112, Firefox Android 113.
- Add only the `storage` permission; retain existing permissions and URL matches.
- Store appearance locally under independent `rfdm.*` keys in `chrome.storage.local`; do not migrate or alter redirect IndexedDB.
- Keep `js/content.js` at `document_end`; add a separate ordered theme script entry at `document_start` with bundled scoped CSS.
- Before settings and page recognition succeed, render the native page. Never hide the whole body to prevent a flash. Native-to-modern restyling may occur after readiness in v1.
- Enable styles only under `html[data-rfdm-enabled="true"]` and verified `data-rfdm-page="list"` or `"thread"`; resolve theme into `data-rfdm-theme="light"|"dark"` independently of RFD's `data-theme`.
- Theme initialization, settings failures and mutation errors cannot stop link cleaning. Unknown or unsupported pages receive no appearance attributes and retain the native UI.
- Package all scripts/styles locally. No remote CSS, fonts, scripts, analytics, content uploads or custom-CSS field.

The [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) provides local settings and change events and requires the `storage` permission. Use those events for open-tab updates. A separate declared content-script entry provides isolated startup timing; see [content-script documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts). Verify implementation against the declared browser floors, including Firefox, before shipping.

## Scope boundaries and rollout

V1 contains supported card deal lists and ordinary threads, appearance settings, reversible cleanup and regressions. Empty lists must remain usable. Login, profile, inbox, account settings, dedicated compose screens, search results, forum directory, print views and unknown templates remain native. A recognized thread's embedded composer still has to work. Additional list variants are admitted only with their own fixtures and checks.

Later increments may support classic listings, search results and forum directory, then profiles/account screens. Further reading aids (quote collapse, hide-user filters, bookmarks, read history, new-reply markers) need separate requirements. Do not silently expand v1 into these features. Rename the extension display name and packaged artifacts to `rfd-enhancement-suite`; preserve browser extension IDs and repository remote.

Release only after actual Chrome and Firefox rendering checks and authenticated manual smoke checks. Use fixtures for mutations and actions that should not submit to live RFD. Preserve existing extension IDs and rule storage. Ship initial appearance on; explain the new switch in README/changelog and store copy. Store publication and version tagging are a separate explicit step.
