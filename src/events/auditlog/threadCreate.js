const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.ThreadCreate,
  once: true,
  async execute(thread) {
    const data = await Audit_Log.findOne({
      Guild: thread.guild.id,
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
      .setTitle("Thread Created")
      .addFields(
        { name: "Name:", value: thread.name, inline: false },
        { name: "Tag:", value: `<#${thread.id}>`, inline: false },
        { name: "ID:", value: thread.id, inline: false },
      );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
