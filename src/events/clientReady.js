const { Events, ActivityType } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		require("../deployment/deployCommands.js");

		client.user.setPresence({
			activities: [{ name: "applio.org", type: ActivityType.Watching }],
			status: "online",
		});

		try {
			console.log(`[CLIENT] Starting the bot as ${client.user.tag}...`);
		} catch (error) {
			console.log(`[ERROR] ${error}`);
		}
	},
};
