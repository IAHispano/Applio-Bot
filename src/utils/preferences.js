const fs = require("fs");
const path = require("path");

const preferencesPath = path.join(__dirname, "preferences.json");

function loadPreferences() {
  try {
    const data = fs.readFileSync(preferencesPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return {};
    } else {
      throw err;
    }
  }
}

function savePreferences(preferences) {
  fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
}

let preferences = loadPreferences();

async function setUserPreference(userId, preferenceKey, value) {
  if (!preferences[userId]) {
    preferences[userId] = {};
  }
  preferences[userId][preferenceKey] = value;
  savePreferences(preferences);
}

async function removeUserPreference(userId, preferenceKey) {
  if (preferences[userId]) {
    delete preferences[userId][preferenceKey];
    if (Object.keys(preferences[userId]).length === 0) {
      delete preferences[userId];
    }
    savePreferences(preferences);
  }
}

function getUserPreference(userId, preferenceKey) {
  return preferences[userId] && preferences[userId][preferenceKey] !== undefined
    ? preferences[userId][preferenceKey]
    : null;
}

module.exports = {
  setUserPreference,
  removeUserPreference,
  getUserPreference,
};
