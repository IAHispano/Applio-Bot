const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.GuildRoleDelete,
  once: true,
  async execute(role) {
    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const data = await Audit_Log.findOne({
      Guild: role.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }
    const auditChannel = client.channels.cache.get(logID);

    auditEmbed
      .setTitle("Role Removed")
      .addFields(
        { name: "Role Name:", value: role.name, inline: false },
        { name: "Role ID:", value: role.id, inline: false },
      );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
