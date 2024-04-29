const { Client, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers,],
});
module.exports = client;

require("./deployment/registerCommands.js");
require("./deployment/registerEvents.js");

client.login(process.env.BOT_TOKEN).catch((error) => {
  console.log(
    "[ERROR] Could not log into the bot, check your token and try again." +
      error,
  );
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});