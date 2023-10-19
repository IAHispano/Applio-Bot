const { Events, ActivityType, EmbedBuilder } = require("discord.js");
const { logsChannelId } = require("../config.json");

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
        const channel = client.channels.cache.get(logsChannelId);

        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTimestamp()
          .setDescription(
            `✅`,
          )

        await channel.send({
          embeds: [embed],
        });
      } catch (error) {
        console.log(error);
      }

    console.log(`Starting the bot as ${client.user.tag}...`);
  },
};
