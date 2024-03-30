const { Events, ActivityType, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const cron = require("node-cron");

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

      if (!process.env.MONGODB_URL)
        return console.log("[DATABASE] No MongoDB URL provided.");

      try {
        await mongoose.connect(process.env.MONGODB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      } catch (error) {
        console.log(`[DATABASE] ${error}`);
      }

      if (mongoose.connect) {
        console.log("[DATABASE] Successfully connected to MongoDB.");
      } else {
        console.log("[DATABASE] Error connecting to MongoDB.");
      }
    } catch (error) {
      console.log(`[ERROR] ${error}`);
    }
  },
};
