const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadThemeFixture } = require('./test/helpers/themeHarness.cjs');
const scripts = ['js/theme/dom.js','js/theme/adapters.js','js/theme/list.js','js/theme/thread.js','js/theme/controller.js'];
test('added deal rows are marked and disabling removes all appearance markers', async () => {
  const h = loadThemeFixture('list-card', { scripts });
  const stop = h.api.controller.start(h.document,h.window); await h.flush();
  const row = h.document.querySelector('li.topic-card').cloneNode(true); row.dataset.threadId='3'; for (const el of [row, ...row.querySelectorAll('[data-rfdm-role]')]) el.removeAttribute('data-rfdm-role');
  h.document.querySelector('#forum-topics ul').append(row); await h.flush();
  assert.equal(row.getAttribute('data-rfdm-role'),'deal-row');
  await h.api.settings.save({enabled:false}); await h.flush();
  assert.equal(row.hasAttribute('data-rfdm-role'),false);
  assert.equal(h.document.querySelectorAll('[data-rfdm-owned]').length,0);
  stop(); h.dispose();
});
test('unsupported replacement restores native appearance', async () => {
  const h = loadThemeFixture('list-card', { scripts });
  const stop = h.api.controller.start(h.document,h.window); await h.flush();
  h.document.querySelector('#forum-topics').remove(); await h.flush();
  assert.equal(h.document.documentElement.hasAttribute('data-rfdm-enabled'),false);
  assert.equal(h.api.controller.getStatus().reason,'unsupported');
  stop(); h.dispose();
});
