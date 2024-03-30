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
    const channels = ["1188315275393777785", "1206185734659252225"];

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancelAnnouncement")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(cancelButton);

    const channelOptions = channels.map((channelId) => {
      return {
        label: channelId,
        value: channelId,
      };
    });

    if (channelOptions.length === 0) {
      interaction.reply({
        content: "Error: Could not find any channels to send the message to.",
        ephemeral: true,
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("selectedChannels")
      .setPlaceholder("Select channels to send the message")
      .addOptions(channelOptions)
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

    collector.on("collect", async (i) => {
      if (i.isStringSelectMenu()) {
        const selectedChannelIds = i.values;
        const selectedChannels = [];

        // Using broadcastEval to search for channels across all shards
        const res = await client.shard.broadcastEval(
          (c, ids) => {
            return ids.map((id) => c.channels.cache.get(id));
          },
          { context: selectedChannelIds }
        );

        // Flattening the array of arrays into a single array of channels
        for (const channels of res) {
          selectedChannels.push(...channels.filter((channel) => channel));
        }

        if (selectedChannels.length !== selectedChannelIds.length) {
          i.update({
            content: ":x: One or more selected channels not found.",
            components: [],
          });
          return;
        }

        // Sending message to selected channels
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
        const allChannels = client.channels
          .fetch({
            cache: false,
            force: true,
          })
          .then((channels) => channels.array());

        const textChannels = allChannels.filter(
          (channel) => channel.type === "GUILD_TEXT"
        );
        const channelsToSend = textChannels.filter((channel) =>
          channels.includes(channel.id)
        );

        for (const channel of channelsToSend) {
          if (channel) {
            channel.send({
              content: message.replace(/\\n/g, "\n"),
              files: attachment ? [attachment] : [],
            });
          } else {
            console.error(
              `Channel with ID ${channel.id} not found or is not a text-based channel.`
            );
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
