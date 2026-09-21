const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup(values = {}, failDB = false) {
  const data = new Map(Object.entries(values));
  const bundled = [{ name: 'Bundled', pattern: '(?<baseUrl>https://example.com)' }];
  const context = vm.createContext({ console, URL, Date, chrome: { runtime: { getURL: path => `extension://${path}` } },
    fetch: async url => {
      assert.equal(url, 'extension://redirects.json');
      return { ok: true, json: async () => bundled };
    },
    indexedDB: { open() {
      const request = {};
      queueMicrotask(() => {
        if (failDB) return request.onerror({ target: { error: new Error('unavailable') } });
        request.onsuccess({ target: { result: {
          close() {},
          transaction() { const transaction = { objectStore() { return {
            get(key) { const req = {}; queueMicrotask(() => {
              req.onsuccess({ target: { result: data.has(key) ? { value: data.get(key) } : undefined } });
              transaction.oncomplete?.();
            }); return req; },
            put({ key, value }) { const req = {}; queueMicrotask(() => {
              data.set(key, value); req.onsuccess?.(); transaction.oncomplete?.();
            }); return req; },
          }; } }; return transaction; },
        } } });
      });
      return request;
    } },
  });
  vm.runInContext(readFileSync('js/utils.js', 'utf8').replaceAll('export ', ''), context);
  return { context, data, bundled };
}

test('serves bundled rules without a network request on a fresh installation', async () => {
  const { context, bundled } = setup();
  assert.equal(typeof context.getRedirects, 'function');
  assert.deepEqual(await context.getRedirects(), bundled);
});

test('serves cached rules, including an intentionally empty configuration', async () => {
  for (const cached of [[], [{ name: 'Custom', pattern: '(?<baseUrl>https://shop.com)' }]]) {
    const { context } = setup({ redirects: cached });
    assert.equal(typeof context.getRedirects, 'function');
    assert.deepEqual(await context.getRedirects(), cached);
  }
});

test('falls back to bundled rules when storage is unavailable', async () => {
  const { context, bundled } = setup({}, true);
  assert.equal(typeof context.getRedirects, 'function');
  assert.deepEqual(await context.getRedirects(), bundled);
});

test('initialization preserves an existing custom config URL', async () => {
  const { context, data } = setup({ config: 'https://example.com/custom.json' });
  await context.setDefaultConfig(false);
  assert.equal(data.get('config'), 'https://example.com/custom.json');
});
