const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    const data = await Audit_Log.findOne({
      Guild: channel.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }
    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const auditChannel = client.channels.cache.get(logID);

    auditEmbed
      .setTitle("Channel Created")
      .addFields(
        { name: "Channel Name:", value: channel.name, inline: false },
        { name: "Channel ID:", value: channel.id, inline: false },
      );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
