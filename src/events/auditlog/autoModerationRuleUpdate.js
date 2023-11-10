const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.AutoModerationRuleUpdate,
  once: true,
  async execute(newAutoModerationRule, oldAutoModerationRule) {
    const data = await Audit_Log.findOne({
      Guild: newAutoModerationRule.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }

    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const auditChannel = client.channels.cache.get(logID);

    auditEmbed.setTitle("Automod Rule Updated").addFields(
      {
        name: "Old Rulename:",
        value: `${oldAutoModerationRule.name}`,
        inline: false,
      },
      {
        name: "Old Actions:",
        value: `${oldAutoModerationRule.actions}`,
        inline: false,
      },
      {
        name: "New Rulename:",
        value: newAutoModerationRule.name,
        inline: false,
      },
      { name: "New Actions:", value: newAutoModerationRule.actions },
    );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
