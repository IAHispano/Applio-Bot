const Audit_Log = require("../../schemas/moderation/auditLog.js");
const { Events, EmbedBuilder } = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    const data = await Audit_Log.findOne({
      Guild: message.guild.id,
    });
    let logID;
    if (data) {
      logID = data.Channel;
    } else {
      return;
    }
    try {
      const auditEmbed = new EmbedBuilder().setColor("White").setTimestamp();

      const auditChannel = client.channels.cache.get(logID);

      auditEmbed
        .setTitle("Message Deleted")
        .addFields(
          { name: "Author:", value: `${message.author}`, inline: false },
          { name: "Message:", value: `${message.content}`, inline: false },
          { name: "Message ID:", value: `${message.id}` },
        );
      await auditChannel.send({ embeds: [auditEmbed] });
    } catch (error) {
      console.log(error);
      return;
    }
  },
};
