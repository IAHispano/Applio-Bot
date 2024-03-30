const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  devOnly: true,
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription(
      "Info » Send a message with Applio's update (Developers only).",
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setNameLocalizations({
          "es-ES": "mensaje",
        })
        .setDescription("Message to be sent.")
        .setDescriptionLocalizations({
          "es-ES": "Mensaje a enviar.",
        })
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setNameLocalizations({
          "es-ES": "adjunto",
        })
        .setDescription("Attachment to be sent.")
        .setDescriptionLocalizations({
          "es-ES": "Adjunto a enviar.",
        }),
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const message = interaction.options
      .getString("message")
      .replace(/\\n/g, "\n");
    const attachment = interaction.options.getAttachment("attachment");
    const channels = ["1159380240271953940", "1188315275393777785"];

    interaction.reply({
      content: `Message sent to ${channels.length} (${channels}) channels.`,
      ephemeral: true,
    });

    for (const channelId of channels) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        channel.send({
          content: message.replace(/\\n/g, "\n"),
          files: attachment ? [attachment] : [],
        });
      } else {
        console.error(`Channel with ID ${channelId} not found.`);
      }
    }
  },
};
