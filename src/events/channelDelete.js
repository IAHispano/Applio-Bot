const Audit_Log = require("../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../bot.js");

module.exports = {
  name: Events.ChannelDelete,
  once: true,
  async execute(channel) {
    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const data = await Audit_Log.findOne({
      Guild: channel.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }

    const auditChannel = client.channels.cache.get(logID);

    auditEmbed
      .setTitle("Channel Deleted")
      .addFields(
        { name: "Channel Name:", value: channel.name, inline: false },
        { name: "Channel ID:", value: channel.id, inline: false },
      );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
