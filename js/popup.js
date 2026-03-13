import { updateRedirects, setDefaultConfig, dbGet, dbSet } from "../js/utils.js"

const inputField = document.getElementById("input-field");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");

const defaultConfig =
  "https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/redirects.json";

dbGet("config").then((value) => {
  if (value) {
    inputField.value = value;
  }
});

saveButton.addEventListener("click", () => {
  const value = inputField.value;
  dbSet("config", value).then(() => {
    updateRedirects();
  });
});

resetButton.addEventListener("click", () => {
  setDefaultConfig().then(() => {
    inputField.value = defaultConfig;
    updateRedirects();
  });
});