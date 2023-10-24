const { Events, ActivityType, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const { logsChannelID, mongodbURL } = require("../config.json");
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

      const channel = client.channels.cache.get(logsChannelId);

      const totalMembers = await client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0,
      );

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTimestamp()
        .setTitle("Bot Information")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          {
            name: "Version",
            value: require("../../package.json").version,
            inline: true,
          },
          {
            name: "Guilds",
            value: client.guilds.cache.size.toString(),
            inline: true,
          },
          {
            name: "Total Members",
            value: totalMembers.toString(),
            inline: true,
          },

          {
            name: "Total Channels",
            value: client.channels.cache.size.toString(),
            inline: true,
          },
          {
            name: "Total Commands",
            value: client.commands.size.toString(),
            inline: true,
          },
        )
        .setDescription("The bot has successfully started.");

      await channel.send({
        embeds: [embed],
      });
    } catch (error) {
      console.log(error);
    }

    console.log(`[CLIENT] Starting the bot as ${client.user.tag}...`);

    try {
      if (!mongodbURL)
        return console.log("[DATABASE] No MongoDB URL provided.");
      await mongoose.connect(mongodbURL, {
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
  },
};
