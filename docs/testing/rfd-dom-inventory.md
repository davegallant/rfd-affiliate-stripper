# RFD DOM inventory for Modern view

Inspected public logged-out HTML on 2026-09-26. Native theme state was not controlled. Synthetic fixtures in `test/fixtures/rfd/` mirror the relevant hierarchy and use invented content. Live browser rendering and signed-in markup need separate verification.

- `https://forums.redflagdeals.com/hot-deals-f9/`: body `.rfd_forums.redesign`; `#site_content > #partition_forums`; `#forum-topics.forum-topics`; rows `li.topic-card.topic[data-thread-id]`; each row's primary link `a.topic-card-info.thread_info[href]` wraps `.thread_title`, retailer and price where present. Native menu, filter and pagination are siblings. Initially supported variant: `card-v1`.
- `https://forums.redflagdeals.com/rabbit-aviator-hat-20-2827128/`: `article#thread.thread_details`, `section.thread_posts > article.thread_post[id]`, original post `.thread_original_post`, `.post_profilearea`, `.post_body > .post_content`, `.post_actions_primary`, `.post_dateline`. Initially supported variant: `thread-v1`.
- Common: `#site_content.with_sidebar`, `.ad_box`, `#header_leaderboard`, `#footer_leaderboard`; site sets `html[data-theme]` for its own dark mode. Sponsored anchors can be inside organic-looking cards, so a sponsored marker alone is insufficient to hide an ancestor.
- Not yet verified: real empty-list template, classic-list variant, signed-in composer, signature class, search, profile/account and Firefox Android. Synthetic empty/editor/signature fixtures protect fallback and basic control preservation, but are not evidence of live site markup.
