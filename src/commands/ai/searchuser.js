const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("searchuser")
    .setNameLocalizations({
      "es-ES": "buscador-usuario",
    })
    .setDescription("RVC » Search models uploaded by a user.")
    .setDescriptionLocalizations({
      "es-ES": "RVC » Busca modelos subidos por un usuario.",
    })
    .addStringOption((option) =>
      option
        .setName("user")
        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription(
          "Enter the username of the user you want to search for.",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Introduce el nombre de usuario del usuario que quieres buscar.",
        })
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const user = interaction.options.getString("user");

    const loadingMessage = await interaction.deferReply();

    try {
      const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/user=${user}`;
      const response = await axios.get(url);
      const data = response.data;

      const pageSize = 1;
      let currentPage = 1;
      let mainEmbed;
      let mainButtons;

      const options = data.slice(0, 25).map((result, index) => ({
        label: `${result.name}`,
        value: `${index + 1}-${result.id}-${result.created_at}`,
        description: `${result.type} · Made by ${result.author_username}`,
        emoji: "<:dot:1134526388456669234>",
      }));

      async function displayPage(page) {
        const startIdx = (page - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, data.length);

        const saveButton = new ButtonBuilder()
          .setLabel("💾 Save")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("send_dm_button");

        const downloadButton = new ButtonBuilder()
          .setLabel("📤 Download")
          .setStyle(ButtonStyle.Link);

        const embed = new EmbedBuilder()

          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setColor("White")
          .setTimestamp();

        for (let i = startIdx; i < endIdx; i++) {
          const result = data[i];
          if (!result) continue;

          const uploadedTimestamp =
            typeof result.created_at === "string"
              ? Date.parse(result.created_at) / 1000
              : typeof result.created_at === "number"
              ? result.created_at / 1000
              : NaN;
          const uploadedText = isNaN(uploadedTimestamp)
            ? "N/A"
            : `<t:${Math.floor(uploadedTimestamp)}:R>`;

          embed.setDescription(
            `**Owner:** ${result.author_username}\n**Uploaded:** ${uploadedText}`,
          );

          const fields = [
            {
              name: "Epochs",
              value: `${result.epochs}`,
              inline: true,
            },
            {
              name: "Technology",
              value: `${result.type}`,
              inline: true,
            },
            {
              name: "Algorithm",
              value: `${result.algorithm}`,
              inline: true,
            },
          ];

          if (result.link.includes("kits.ai")) {
            embed.addFields({
              name: "Information",
              value: `This model can be found on the Kits.AI platform, visit their page for more information.`,
            });
          } else {
            embed.addFields(fields);
          }

          if (result.image_url !== "N/A") {
            embed.setThumbnail(result.image_url);
          } else {
            embed.setThumbnail(
              interaction.user.displayAvatarURL({ dynamic: true }),
            );
          }

          if (typeof result.link === "string" && result.link) {
            downloadButton.setURL(result.link);
          } else {
            downloadButton.setDisabled(true);
            downloadButton.setURL("https://applio.org");
          }
          embed.setTitle(result.name);
        }

        const botInviteButton = new ButtonBuilder()
          .setLabel("🤖 Bot Invite")
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
          )
          .setStyle(ButtonStyle.Link);

        const menu = new StringSelectMenuBuilder()
          .setCustomId(interaction.user.id)
          .setPlaceholder(`🔎 ${data.length} models found...`)
          .setOptions(options);

        if (data.length === 1) {
          menu.setDisabled(true);
        }

        const row_menu = new ActionRowBuilder().addComponents(menu);

        const row_buttons = new ActionRowBuilder().addComponents(
          saveButton,
          downloadButton,
          botInviteButton,
        );
        mainEmbed = embed;
        mainButtons = row_buttons;
        loadingMessage.edit({
          content: `I have found ${data.length} models created by ${user}.`,
          embeds: [embed],
          components: [row_menu, row_buttons],
        });
      }

      displayPage(currentPage);

      let menuCollector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (i) =>
          i.user.id === interaction.user.id &&
          i.customId === interaction.user.id,
      });

      menuCollector.on("collect", async (interaction) => {
        const selectedResult = data.find(
          (result) =>
            `${data.indexOf(result) + 1}-${result.id}-${result.created_at}` ===
            interaction.values[0],
        );

        if (selectedResult) {
          const downloadButton = new ButtonBuilder()
            .setLabel("📤 Download")
            .setStyle(ButtonStyle.Link);

          const embed = new EmbedBuilder()
            .setTitle(selectedResult.name)
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setColor("White")
            .setTimestamp();

          const uploadedTimestamp =
            typeof selectedResult.created_at === "string"
              ? Date.parse(selectedResult.created_at) / 1000
              : typeof selectedResult.created_at === "number"
              ? selectedResult.created_at / 1000
              : NaN;
          const uploadedText = isNaN(uploadedTimestamp)
            ? "N/A"
            : `<t:${Math.floor(uploadedTimestamp)}:R>`;

          embed.setDescription(
            `**Owner:** ${selectedResult.author_username}\n**Uploaded:** ${uploadedText}`,
          );

          const fields = [
            {
              name: "Epochs",
              value: `${selectedResult.epochs}`,
              inline: true,
            },
            {
              name: "Technology",
              value: `${selectedResult.type}`,
              inline: true,
            },
            {
              name: "Algorithm",
              value: `${selectedResult.algorithm}`,
              inline: true,
            },
          ];

          if (selectedResult.link.includes("kits.ai")) {
            embed.addFields({
              name: "Information",
              value: `This model can be found on the Kits.AI platform, visit their page for more information.`,
            });
          } else {
            embed.addFields(fields);
          }

          if (selectedResult.image_url !== "N/A") {
            embed.setThumbnail(selectedResult.image_url);
          } else {
            embed.setThumbnail(
              interaction.user.displayAvatarURL({ dynamic: true }),
            );
          }

          if (typeof selectedResult.link === "string" && selectedResult.link) {
            downloadButton.setURL(selectedResult.link);
          } else {
            downloadButton.setDisabled(true);
            downloadButton.setURL("https://applio.org");
          }

          const saveButton = new ButtonBuilder()
            .setLabel("💾 Save")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("send_dm_button");

          const botInviteButton = new ButtonBuilder()
            .setLabel("🤖 Bot Invite")
            .setURL(
              `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
            )
            .setStyle(ButtonStyle.Link);
          const row_buttons = new ActionRowBuilder().addComponents(
            saveButton,
            downloadButton,
            botInviteButton,
          );

          const menu = new StringSelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder(`🔎 ${data.length} models found...`)
            .setOptions(options);

          const row_menu = new ActionRowBuilder().addComponents(menu);
          mainEmbed = embed;
          mainButtons = row_buttons;
          interaction.update({
            embeds: [embed],
            components: [row_menu, row_buttons],
          });
        }
      });

      let buttonCollector = interaction.channel.createMessageComponentCollector(
        {
          componentType: ComponentType.Button,
        },
      );

      buttonCollector.on("collect", async (interaction) => {
        if (interaction.customId === "send_dm_button") {
          interaction.reply({
            content: `💾 ${interaction.user}, sent you a DM with the model information!`,
            ephemeral: true,
          });
          interaction.user
            .send({
              embeds: [mainEmbed],
              components: [mainButtons],
            })
            .catch(() => {
              interaction.channel.send({
                content: `❌ ${interaction.user}, I couldn't send you a DM, make sure you have them enabled.`,
                ephemeral: true,
              });
            });
        }
      });
    } catch (error) {
      //console.log(error);
      const embed = new EmbedBuilder()
        .setDescription(`I have not found models created by ${user}...`)
        .setColor("Red")
        .setFooter({
          text: `Powered by Applio — Make sure you spelled it correctly!`,
        });
      await loadingMessage.edit({
        embeds: [embed],
        content: null,
      });
    }
  },
};
