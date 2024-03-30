const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  devOnly: true,
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription(
      "Info » Send a message with Applio's update (Developers only)."
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
        .setRequired(true)
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
        })
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const message = interaction.options
      .getString("message")
      .replace(/\\n/g, "\n");
    const attachment = interaction.options.getAttachment("attachment") || null;
    const channels = ["1188315275393777785", "1159380240271953940"];
    const channelNames = channels.map(
      (id) => client.channels.cache.get(id)?.name
    );

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancelAnnouncement")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(cancelButton);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("selectedChannels")
      .setPlaceholder("Select channels to send the message")
      .addOptions(
        channelNames.map((name, index) => ({
          label: name,
          value: channels[index],
          description: client.channels.cache.get(channels[index]).guild.name,
        }))
      )
      .setMaxValues(channels.length)
      .setMinValues(1);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const attachmentUrl = attachment ? attachment.url : "";
    const attachmentPreview = attachment
      ? `[${attachment.name}](${attachmentUrl})`
      : "";

    interaction.reply({
      content: `I'm ready to send a message to **${channels.length}** channels. Please confirm your action.\n\n**Message:**\n${message}\n${attachmentPreview}`,
      components: [selectRow, row],
      ephemeral: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
      filter: collectorFilter,
      time: 30000, // Timeout after 30 seconds
    });

    collector.on("collect", (i) => {
      if (i.isStringSelectMenu()) {
        const selectedChannelIds = i.values;
        const selectedChannels = selectedChannelIds.map((id) =>
          client.channels.cache.get(id)
        );

        if (selectedChannels.some((channel) => !channel)) {
          i.update({
            content: ":x: One or more selected channels not found.",
            components: [],
          });
          return;
        }

        for (const channel of selectedChannels) {
          channel.send({
            content: message.replace(/\\n/g, "\n"),
            files: attachment ? [attachment] : [],
          });
        }

        i.update({
          content: `Message sent to **${selectedChannels.length}** channels.\n\n**Message:**\n${message}`,
          components: [],
        });
      } else if (i.customId === "confirmAnnouncement") {
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
        i.update({
          content: "Message sent to the specified channels.",
          components: [],
        });
      } else if (i.customId === "cancelAnnouncement") {
        i.update({
          content: "Message sending canceled.",
          components: [],
        });
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "Message sending timed out.",
          components: [],
        });
      }
    });
  },
};
