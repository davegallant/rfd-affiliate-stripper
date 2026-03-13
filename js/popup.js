import { updateRedirects, setDefaultConfig, dbGet, dbSet } from "../js/utils.js"

const inputField = document.getElementById("input-field");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.getElementById("status-message");

const defaultConfig =
  "https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/main/redirects.json";

let statusTimeout;

function showStatus(message, type) {
  clearTimeout(statusTimeout);
  statusMessage.textContent = message;
  statusMessage.className = type;

  statusTimeout = setTimeout(() => {
    statusMessage.classList.add("fade-out");
    setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "";
    }, 500);
  }, 4000);
}

function setButtonsDisabled(disabled) {
  saveButton.disabled = disabled;
  resetButton.disabled = disabled;
}

async function validateAndFetchConfig(url) {
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Failed to fetch URL");
  }

  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`);
  }

  try {
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Config must be a JSON array");
    }
    return data;
  } catch (e) {
    if (e.message === "Config must be a JSON array") {
      throw e;
    }
    throw new Error("Response is not valid JSON");
  }
}

dbGet("config").then((value) => {
  if (value) {
    inputField.value = value;
  }
});

saveButton.addEventListener("click", async () => {
  const value = inputField.value.trim();

  if (!value) {
    showStatus("URL cannot be empty", "error");
    return;
  }

  setButtonsDisabled(true);
  showStatus("Validating…", "success");

  try {
    await validateAndFetchConfig(value);
    await dbSet("config", value);
    await updateRedirects();
    showStatus("Saved successfully", "success");
  } catch (e) {
    showStatus(e.message, "error");
  } finally {
    setButtonsDisabled(false);
  }
});

resetButton.addEventListener("click", async () => {
  setButtonsDisabled(true);
  showStatus("Resetting…", "success");

  try {
    await setDefaultConfig();
    inputField.value = defaultConfig;
    await updateRedirects();
    showStatus("Reset to default", "success");
  } catch (e) {
    showStatus("Reset failed: " + e.message, "error");
  } finally {
    setButtonsDisabled(false);
  }
});