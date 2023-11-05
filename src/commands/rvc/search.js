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
const { client_id, bot_perms, applio_api_key } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setNameLocalizations({
      "es-ES": "buscador",
    })
    .setDescription("RVC » Search any voice model in a huge database.")
    .setDescriptionLocalizations({
      "es-ES":
        "RVC » Busca cualquier modelo de voz en una enorme base de datos.",
    })
    .addStringOption((option) =>
      option
        .setName("model")
        .setNameLocalizations({
          "es-ES": "modelo",
        })
        .setDescription("Enter the name of the model you wish to search for.")
        .setDescriptionLocalizations({
          "es-ES": "Ingrese el nombre del modelo que desea buscar.",
        })
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("technology")
        .setDescription("Select the technology of the model.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona la tecnología del modelo.",
        })
        .setRequired(false)
        .addChoices(
          { name: "RVC", value: "rvc" },
          { name: "Kits.AI", value: "kits.ai" }
        )
    )
    .setDMPermission(false),

  async execute(interaction) {
    const model = interaction.options.getString("model");
    const technology = interaction.options.getString("technology");
    if (model.length <= 3) {
      const embed = new EmbedBuilder()
        .setDescription("Please enter a model name with at least 4 characters.")
        .setColor("Red");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const loadingMessage = await interaction.reply({
      content: "🔎 Loading models...",
    });

    try {
      let url;

      if (!technology) {
        url = `https://api.applio.org/key=${applio_api_key}/models/search?name=${model}`;
      } else {
        url = `https://api.applio.org/key=${applio_api_key}/models/search?name=${model}&type=${technology}`;
      }
      const response = await axios.get(url);
      const data = response.data;

      const pageSize = 1;
      let currentPage = 1;

      const options = data.slice(0, 25).map((result, index) => ({
        label: `${result.name}`,
        value: `${index + 1}-${result.id}-${result.created_at}`,
        description: `${result.type} · Made by ${result.author_username}`,
        emoji: "<:dot:1134526388456669234>",
      }));

      const displayPage = (page) => {
        const startIdx = (page - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, data.length);

        const downloadButton = new ButtonBuilder()
          .setLabel("📤 Download")
          .setStyle(ButtonStyle.Link);

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor("#5865F2")
          .setTimestamp();

        for (let i = startIdx; i < endIdx; i++) {
          const result = data[i];
          if (!result) continue;

          const uploadedTimestamp = Date.parse(result.created_at) / 1000;
          const uploadedText = isNaN(uploadedTimestamp)
            ? "N/A"
            : `<t:${Math.floor(uploadedTimestamp)}:R>`;

          embed.setDescription(
            `**Owner:** ${result.author_username}\n**Uploaded:** ${uploadedText}`
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
            embed.setImage(result.image_url);
          } else {
            embed.setImage(null);
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
            `https://discord.com/api/oauth2/authorize?client_id=${client_id}&permissions=${bot_perms}&scope=bot`
          )
          .setStyle(ButtonStyle.Link);

        const menu = new StringSelectMenuBuilder()
          .setCustomId("models")
          .setPlaceholder(`🔎 ${data.length} models found...`)
          .setOptions(options);

        if (data.length === 1) {
          menu.setDisabled(true);
        }

        const row_menu = new ActionRowBuilder().addComponents(menu);

        const row_buttons = new ActionRowBuilder().addComponents(
          downloadButton,
          botInviteButton
        );

        loadingMessage.edit({
          content: `I have found ${data.length} results for the search ${model}...`,
          embeds: [embed],
          components: [row_menu, row_buttons],
        });
      };

      displayPage(currentPage);

      let collector;

      collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
      });

      collector.on("collect", async (interaction) => {
        const selectedResult = data.find(
          (result) =>
            `${data.indexOf(result) + 1}-${result.id}-${result.created_at}` ===
            interaction.values[0]
        );

        if (selectedResult) {
          const downloadButton = new ButtonBuilder()
            .setLabel("📤 Download")
            .setStyle(ButtonStyle.Link);

          const embed = new EmbedBuilder()
            .setTitle(selectedResult.name)
            .setColor("#5865F2")
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setColor("#5865F2")
            .setTimestamp();

          const uploadedTimestamp =
            Date.parse(selectedResult.created_at) / 1000;
          const uploadedText = isNaN(uploadedTimestamp)
            ? "N/A"
            : `<t:${Math.floor(uploadedTimestamp)}:R>`;

          embed.setDescription(
            `**Owner:** ${selectedResult.author_username}\n**Uploaded:** ${uploadedText}`
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
            embed.setImage(selectedResult.image_url);
          } else {
            embed.setImage(null);
          }

          if (typeof selectedResult.link === "string" && selectedResult.link) {
            downloadButton.setURL(selectedResult.link);
          } else {
            downloadButton.setDisabled(true);
            downloadButton.setURL("https://applio.org");
          }

          const botInviteButton = new ButtonBuilder()
            .setLabel("🤖 Bot Invite")
            .setURL(
              `https://discord.com/api/oauth2/authorize?client_id=${client_id}&permissions=${bot_perms}&scope=bot`
            )
            .setStyle(ButtonStyle.Link);
          const row_buttons = new ActionRowBuilder().addComponents(
            downloadButton,
            botInviteButton
          );

          const menu = new StringSelectMenuBuilder()
            .setCustomId("models")
            .setPlaceholder(`🔎 ${data.length} models found...`)
            .setOptions(options);

          const row_menu = new ActionRowBuilder().addComponents(menu);

          interaction.update({
            embeds: [embed],
            components: [row_menu, row_buttons],
          });
        }
      });
    } catch (error) {
      //console.log(error);
      const embed = new EmbedBuilder()
        .setDescription(`No results found for the search ${model}...`)
        .setColor("#5865F2")
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
