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

      const totalMembers = await client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
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
          }
        )
        .setDescription("The bot has successfully started.");

      await channel.send({
        embeds: [embed],
      });
    } catch (error) {
      console.log(error);
    }

    console.log(`Starting the bot as ${client.user.tag}...`);
  },
};
