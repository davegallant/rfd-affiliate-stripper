import { updateRedirects, setDefaultConfig, dbGet } from "../js/utils.js"

function setAlarm() {
  chrome.alarms.get('update-redirects', alarm => {
    if (!alarm) {
      chrome.alarms.create('update-redirects', { periodInMinutes: 60 });
    }
  });
}

chrome.alarms.onAlarm.addListener(() => {
  updateRedirects();
});

chrome.runtime.onInstalled.addListener(() => {
  setDefaultConfig();
  updateRedirects();
  setAlarm();
});

//Ensure alarm is created
chrome.runtime.onStartup.addListener(() => {
  setAlarm();
});

// Serve redirects from IndexedDB to content scripts via messaging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRedirects") {
    dbGet("redirects").then((redirects) => {
      sendResponse({ redirects: redirects || [] });
    }).catch((error) => {
      console.log("Error fetching redirects from IndexedDB:", error);
      sendResponse({ redirects: [] });
    });
    return true; // keep the message channel open for async response
  }
});
