export function updateRedirects() {
  chrome.storage.local.get("config", function (URL) {
    fetch(URL.config)
      .then((res) => res.json())
      .then((res) => {
        chrome.storage.local
          .set({
            redirects: res,
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

export function setDefaultConfig() {
  chrome.storage.local.set({
    config:
    "https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/redirects.json",
  });
}