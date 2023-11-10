const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.GuildRoleCreate,
  once: true,
  async execute(role) {
    const data = await Audit_Log.findOne({
      Guild: role.guild.id,
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
      .setTitle("Role Created")
      .addFields(
        { name: "Role Name:", value: role.name, inline: false },
        { name: "Role ID:", value: role.id, inline: false },
      );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
