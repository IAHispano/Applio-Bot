const Audit_Log = require("../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../bot.js");

module.exports = {
  name: Events.ChannelUpdate,
  once: true,
  async execute(oldChannel, newChannel) {
    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const data = await Audit_Log.findOne({
      Guild: oldChannel.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }

    const auditChannel = client.channels.cache.get(logID);
    const changes = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push(`Name: \`${oldChannel.name}\` → \`${newChannel.name}\``);
    }

    if (oldChannel.topic !== newChannel.topic) {
      changes.push(
        `Topic: \`${oldChannel.topic || "None"}\` → \`${
          newChannel.topic || "None"
        }\``,
      );
    }

    if (changes.length === 0) return;

    const changesText = changes.join("\n");

    auditEmbed
      .setTitle("Channel Updated")
      .addFields({ name: "Changes:", value: changesText });
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
