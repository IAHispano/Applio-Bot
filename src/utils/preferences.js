const fs = require("fs").promises;
const path = require("path");

const preferencesPath = path.join(__dirname, "preferences.json");
let preferences = {};

async function loadPreferences() {
	try {
		const data = await fs.readFile(preferencesPath, "utf-8");
		preferences = JSON.parse(data);
	} catch (err) {
		if (err.code === "ENOENT") {
			preferences = {};
		} else {
			throw err;
		}
	}
}

async function savePreferences() {
	try {
		await fs.writeFile(preferencesPath, JSON.stringify(preferences, null, 2));
	} catch (err) {
		console.error("Error saving preferences:", err);
	}
}

let saveTimeout;
function debounceSavePreferences(delay = 500) {
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => savePreferences(), delay);
}

async function setUserPreference(userId, preferenceKey, value) {
	if (!preferences[userId]) {
		preferences[userId] = {};
	}
	preferences[userId][preferenceKey] = value;
	debounceSavePreferences();
}

async function removeUserPreference(userId, preferenceKey) {
	if (preferences[userId]) {
		delete preferences[userId][preferenceKey];
		if (Object.keys(preferences[userId]).length === 0) {
			delete preferences[userId];
		}
		debounceSavePreferences();
	}
}

function getUserPreference(userId, preferenceKey) {
	return preferences[userId] && preferences[userId][preferenceKey] !== undefined
		? preferences[userId][preferenceKey]
		: null;
}

loadPreferences().catch((err) => {
	console.error("Error loading preferences:", err);
});

module.exports = {
	setUserPreference,
	removeUserPreference,
	getUserPreference,
};
