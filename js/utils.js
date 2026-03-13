// IndexedDB utility functions
const DB_NAME = 'rfdAffiliateStripperDB';
const STORE_NAME = 'config';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = (event) => resolve(event.target.result?.value);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function updateRedirects() {
  try {
    const configUrl = await dbGet("config");
    if (!configUrl) {
      console.log("No config URL found in IndexedDB");
      return;
    }
    const res = await fetch(configUrl);
    const redirects = await res.json();
    await dbSet("redirects", redirects);
  } catch (error) {
    console.log(error);
  }
}

export async function setDefaultConfig() {
  await dbSet(
    "config",
    "https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/redirects.json"
  );
}