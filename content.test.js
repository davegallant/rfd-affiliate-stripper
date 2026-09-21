const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { stripRedirect } = require('./js/stripRedirect.js');
const rules = require('./redirects.json');

function anchor(href, eligible = true) {
  return { nodeType: 1, href, eligible,
    matches() { return this.eligible; }, querySelectorAll() { return []; } };
}

function start(links) {
  let observer;
  let listener;
  let requests = 0;
  vm.runInNewContext(readFileSync('js/content.js', 'utf8'), {
    document: { querySelectorAll: () => links, documentElement: {} },
    MutationObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
    },
    chrome: { runtime: {
      sendMessage(message, callback) { requests++; callback({ redirects: rules }); },
      onMessage: { addListener(callback) { listener = callback; } },
    } }, stripRedirect, console,
  });
  return { mutate(records) { observer?.(records); },
    get requests() { return requests; },
    activity() { let response; listener?.({ type: 'getActivity' }, {}, value => { response = value; }); return response; } };
}

test('cleans links inserted after startup, including nested anchors', () => {
  const initial = anchor('https://www.amazon.ca/dp/TEST?tag=rfd');
  const page = start([initial]);
  assert.equal(initial.href, 'https://www.amazon.ca/dp/TEST');
  const added = anchor('https://www.amazon.ca/dp/NEW?tag=rfd');
  const nested = anchor('https://www.amazon.ca/dp/NESTED?tag=rfd');
  page.mutate([{ type: 'childList', addedNodes: [added, {
    nodeType: 1, matches: () => false, querySelectorAll: () => [nested],
  }] }]);
  assert.equal(added.href, 'https://www.amazon.ca/dp/NEW');
  assert.equal(nested.href, 'https://www.amazon.ca/dp/NESTED');
  assert.equal(page.requests, 1);
});

test('cleans changed hrefs and newly eligible links without repeated writes', () => {
  const link = anchor('https://www.amazon.ca/dp/TEST');
  const page = start([link]);
  let href = 'https://www.amazon.ca/dp/OTHER?tag=rfd';
  let writes = 0;
  Object.defineProperty(link, 'href', { get: () => href, set(value) { writes++; href = value; } });
  page.mutate([{ type: 'attributes', target: link }]);
  page.mutate([{ type: 'attributes', target: link }]);
  assert.equal(href, 'https://www.amazon.ca/dp/OTHER');
  assert.equal(writes, 1);
  const other = anchor('https://www.amazon.ca/dp/NEW?tag=rfd', false);
  page.mutate([{ type: 'attributes', target: other }]);
  assert.match(other.href, /tag=/);
  other.eligible = true;
  page.mutate([{ type: 'attributes', target: other }]);
  assert.equal(other.href, 'https://www.amazon.ca/dp/NEW');
});
