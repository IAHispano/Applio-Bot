const fs = require("fs").promises;
const path = require("path");

const blacklistPath = path.join(__dirname, "blacklist.json");
let blacklist = [];

async function loadBlacklist() {
	try {
		const data = await fs.readFile(blacklistPath, "utf-8");
		blacklist = JSON.parse(data);
	} catch (err) {
		if (err.code === "ENOENT") {
			blacklist = [];
		} else {
			throw err;
		}
	}
}

async function saveBlacklist() {
	try {
		await fs.writeFile(blacklistPath, JSON.stringify(blacklist, null, 2));
	} catch (err) {
		console.error("Error saving blacklist:", err);
	}
}

// Debounce save operation to reduce unnecessary writes
let saveTimeout;
function debounceSaveBlacklist(delay = 500) {
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => saveBlacklist(), delay);
}

async function AddBlackList(value) {
	if (!blacklist.includes(value)) {
		blacklist.push(value);
		debounceSaveBlacklist();
	}
}

async function RemoveBlackList(value) {
	blacklist = blacklist.filter((item) => item !== value);
	debounceSaveBlacklist();
}

function IsInBlacklist(value) {
	return blacklist.includes(value);
}

loadBlacklist().catch((err) => {
	console.error("Error loading blacklist:", err);
});

module.exports = {
	AddBlackList,
	RemoveBlackList,
	IsInBlacklist,
};
