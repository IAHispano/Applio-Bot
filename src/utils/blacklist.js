const fs = require("fs").promises;
const path = require("path");

const blacklistPath = path.join(__dirname, "blacklist.json");
let blacklist = {};

async function loadBlacklist() {
	try {
		blacklist = JSON.parse(await fs.readFile(blacklistPath, "utf-8"));
	} catch (err) {
		if (err.code === "ENOENT") {
			blacklist = {};
		} else {
			console.error("Error loading blacklist:", err);
		}
	}
}

let saveTimeout;
function debounceSaveBlacklist(delay = 500) {
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(saveBlacklist, delay);
}

async function saveBlacklist() {
	try {
		await fs.writeFile(blacklistPath, JSON.stringify(blacklist, null, 2));
	} catch (err) {
		console.error("Error saving blacklist:", err);
	}
}

function AddBlackList(userId, command) {
	const key = !command || command.toLowerCase() === "all" ? "all" : command;
	blacklist[key] ??= [];
	if (!blacklist[key].includes(userId)) blacklist[key].push(userId);
	debounceSaveBlacklist();
}

function RemoveBlackList(userId, command) {
	const removeFromList = (cmd) => {
		if (blacklist[cmd]) {
			blacklist[cmd] = blacklist[cmd].filter((id) => id !== userId);
			if (!blacklist[cmd].length) delete blacklist[cmd];
		}
	};

	if (!command || command.toLowerCase() === "all") {
		Object.keys(blacklist).forEach(removeFromList);
	} else {
		removeFromList(command);
	}

	debounceSaveBlacklist();
}

function IsInBlacklist(userId, command) {
	return (
		blacklist["all"]?.includes(userId) ||
		blacklist[command]?.includes(userId) ||
		false
	);
}

loadBlacklist().catch((err) => console.error("Error loading blacklist:", err));

module.exports = {
	AddBlackList,
	RemoveBlackList,
	IsInBlacklist,
};
