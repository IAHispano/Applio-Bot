const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.GuildBanAdd,
  async execute(guild, user) {
    const data = await Audit_Log.findOne({
      Guild: guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }
    const banInfo = await guild.fetchBan(user);
    if (!banInfo) return;

    const { reason, executor } = banInfo;
    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const auditChannel = client.channels.cache.get(logID);

    auditEmbed
      .setTitle("Ban Added")
      .addFields(
        { name: "Banned Member:", value: user.tag, inline: false },
        { name: "Executor:", value: executor.tag, inline: false },
        { name: "Reason:", reason },
      );

    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
