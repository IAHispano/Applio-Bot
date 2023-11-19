const { Events, ActivityType, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const { mongodb_url } = require("../config.json");
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
      cron.schedule("*/60 * * * * *", async () => {
        const users = await User.find({ isPremium: true });

        if (!users || !users.length) return;

        await users.forEach(async (user) => {
          if (Date.now() >= user.expiresAt) {
            user.isPremium = false;
            user.PremID = null;
            user.redeemedAt = null;
            user.expiresAt = null;
            user.plan = null;
            user.save();
            const embed = new EmbedBuilder()
              .setAuthor({
                name: `Premium Subscription!`,
                iconURL: client.user.displayAvatarURL(),
              })
              .setDescription(
                `Hey <@${user.Id}>. Your Premium subscription is over.`,
              )
              .setColor("#ff0000")
              .setTimestamp();
            try {
              client.users.fetch(user.Id).then((user) => {
                user.send({ embeds: [embed] });
              });
            } catch (error) {
              console.log(`[ERROR] ${error}`);
            }

            console.log(`[DEBUG] Premium Expired for (${user.Id})`);
          }
        });
      });

      console.log(`[CLIENT] Starting the bot as ${client.user.tag}...`);

      if (!mongodb_url)
        return console.log("[DATABASE] No MongoDB URL provided.");

      try {
        await mongoose.connect(mongodb_url, {
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
