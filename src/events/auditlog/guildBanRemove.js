const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.GuildBanRemove,
  once: true,
  async execute(user) {
    const data = await Audit_Log.findOne({
      Guild: user.guild.id,
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
      .setTitle("Ban Removed")
      .addFields({ name: "Member:", value: `${user}` });
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
