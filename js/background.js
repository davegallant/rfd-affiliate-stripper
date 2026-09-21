import { updateRedirects, setDefaultConfig, getRedirects } from "../js/utils.js"

function setAlarm() {
  chrome.alarms.get('update-redirects', alarm => {
    if (!alarm) {
      chrome.alarms.create('update-redirects', { periodInMinutes: 60 });
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'update-redirects') updateRedirects().catch(console.error);
});

chrome.runtime.onInstalled.addListener(() => {
  setDefaultConfig(false).then(() => updateRedirects()).catch(console.error);
  setAlarm();
});

//Ensure alarm is created
chrome.runtime.onStartup.addListener(() => {
  setAlarm();
});

// Serve redirects from IndexedDB to content scripts via messaging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRedirects") {
    getRedirects().then((redirects) => {
      sendResponse({ redirects });
    }).catch((error) => {
      console.log("Error fetching redirects from IndexedDB:", error);
      sendResponse({ redirects: [] });
    });
    return true; // keep the message channel open for async response
  }
});
