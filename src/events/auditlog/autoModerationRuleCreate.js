const Audit_Log = require("../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../bot.js");

module.exports = {
  name: Events.AutoModerationRuleCreate,
  async execute(autoModerationRule) {
    const data = await Audit_Log.findOne({
      Guild: autoModerationRule.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }

    const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

    const auditChannel = client.channels.cache.get(logID);

    auditEmbed.setTitle("Automod Rule Created").addFields(
      {
        name: "Rulecreator:",
        value: `<@${autoModerationRule.creatorId}>`,
        inline: false,
      },
      { name: "Rulename:", value: autoModerationRule.name },
      {
        name: "Actions:",
        value: `${autoModerationRule.actions}`,
        inline: false,
      },
    );
    await auditChannel.send({ embeds: [auditEmbed] });
  },
};
