const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
module.exports = client;

require("./deployment/registerCommands.js");
require("./deployment/registerEvents.js");

client.login(process.env.BOT_TOKEN).catch(() => {
  console.log(
    "[ERROR] Could not log into the bot, check your token and try again.",
  );
});
