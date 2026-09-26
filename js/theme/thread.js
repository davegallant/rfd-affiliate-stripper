(() => {
  const api = globalThis.RFDModern ||= {};
  function enhance(root, settings, journal) {
    const posts = root.matches?.('article.thread_post[id]') ? [root] : [...root.querySelectorAll('article.thread_post[id]')];
    for (const post of posts) {
      if (!post.querySelector('.post_body .post_content')) continue;
      journal.setAttribute(post, 'data-rfdm-role', 'post');
      for (const body of post.querySelectorAll('.post_body .post_content')) journal.setAttribute(body, 'data-rfdm-role', 'post-body');
      for (const item of post.querySelectorAll('.post_profilearea :is(.profile_datejoined, .profile_numposts, .profile_upvotes)')) journal.setAttribute(item, 'data-rfdm-role', 'profile-stats');
    }
  }
  api.thread = { enhance };
})();
