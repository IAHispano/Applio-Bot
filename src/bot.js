const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});
module.exports = client;

require("./deployment/registerCommands.js");
require("./deployment/registerEvents.js");

client.login(process.env.BOT_TOKEN).catch(() => {
  console.log(
    "[ERROR] Could not log into the bot, check your token and try again.",
  );
});
