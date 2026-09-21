import { updateRedirects, dbGet, DEFAULT_CONFIG_URL } from "../js/utils.js"

const inputField = document.getElementById("input-field");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.getElementById("status-message");

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

dbGet("config").then((value) => {
  if (value) {
    inputField.value = value;
  }
}).catch(error => showStatus(error.message, 'error'));

saveButton.addEventListener("click", async () => {
  const value = inputField.value.trim();

  if (!value) {
    showStatus("URL cannot be empty", "error");
    return;
  }

  setButtonsDisabled(true);
  showStatus("Validating…", "success");

  try {
    await updateRedirects(value);
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
    await updateRedirects(DEFAULT_CONFIG_URL);
    inputField.value = DEFAULT_CONFIG_URL;
    showStatus("Reset to default", "success");
  } catch (e) {
    showStatus("Reset failed: " + e.message, "error");
  } finally {
    setButtonsDisabled(false);
  }
});
