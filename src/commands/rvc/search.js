const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { clientId, bot_perms } = require("../../config.json");
const fs = require("fs");
const path = require("path");

async function loadData(directory) {
  const files = fs.readdirSync(directory);
  const data = [];

  for (const file of files) {
    if (path.extname(file) === ".json") {
      const content = fs.readFileSync(path.join(directory, file), "utf8");
      data.push(JSON.parse(content));
    }
  }

  return data;
}

function searchSimilarities(searchedName, data) {
  const results = [];
  searchedName = searchedName.toLowerCase(); // Convert to lowercase for case-insensitive search

  for (const item of data) {
    if (item.context && item.context.Name) {
      const name = item.context.Name.toLowerCase();
      if (name.includes(searchedName)) {
        results.push({
          name: item.context.Name,
          id: item.id,
          owner_id: item.owner,
          owner_username: item.owner_username ? item.owner_username : "N/A",
          link: item.context.Link,
          epoch:
            item.context.Epoch !== undefined && item.context.Epoch !== null
              ? item.context.Epoch
              : "N/A",
          algorithm:
            item.context.Algorithm !== undefined &&
            item.context.Algorithm !== null
              ? item.context.Algorithm
              : "N/A",
          type:
            item.context.Type !== undefined && item.context.Type !== null
              ? item.context.Type
              : "N/A",
          uploadDate: item.upload
            ? new Date(item.upload).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "N/A",
          attachments: item.attachments,
        });
      }
    }
  }

  return results;
}

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
    .setDMPermission(false),

  async execute(interaction) {
    const model = interaction.options.getString("model");
    const loadingMessage = await interaction.reply({
      content: "🔎 Loading models...",
    });

    const data = await loadData("models");
    const results = searchSimilarities(model, data);

    if (results.length === 0) {
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
      return;
    }

    const pageSize = 1;
    let currentPage = 1;

    const options = results.slice(0, 25).map((result, index) => ({
      label: `${result.name} (${result.epoch} Epochs)`,
      value: `${index + 1}-${result.id}-${result.uploadDate}`,
      description: `${result.type} · ${result.uploadDate}`,
      emoji: "<:dot:1134526388456669234>",
    }));

    const displayPage = (page) => {
      const startIdx = (page - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, results.length);

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
        const result = results[i];
        if (!result) continue;

        embed.setDescription(`
        **Owner:** ${result.owner_username}
        **Uploaded:** ${result.uploadDate}
        `);

        const fields = [
          {
            name: "Epochs",
            value: `${result.epoch}`,
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
        if (
          result.attachments &&
          result.attachments[0] &&
          result.attachments[0].url
        ) {
          embed.setImage(result.attachments[0].url);
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
          `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`
        )
        .setStyle(ButtonStyle.Link);

      const menu = new StringSelectMenuBuilder()
        .setCustomId("models")
        .setPlaceholder(`🔎 ${results.length} models found...`)
        .setOptions(options);

      if (results.length === 1) {
        menu.setDisabled(true);
      }

      const row_menu = new ActionRowBuilder().addComponents(menu);

      const row_buttons = new ActionRowBuilder().addComponents(
        downloadButton,
        botInviteButton
      );

      loadingMessage.edit({
        content: `I have found ${results.length} results for the search ${model}...`,
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
      const selectedResult = results.find(
        (result) =>
          `${results.indexOf(result) + 1}-${result.id}-${result.uploadDate}` ===
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

        embed.setDescription(`
          **Owner:** ${selectedResult.owner_username}
          **Uploaded:** ${selectedResult.uploadDate}
          `);

        const fields = [
          {
            name: "Epochs",
            value: `${selectedResult.epoch}`,
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

        if (
          selectedResult.attachments &&
          selectedResult.attachments[0] &&
          selectedResult.attachments[0].url
        ) {
          embed.setImage(selectedResult.attachments[0].url);
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
            `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`
          )
          .setStyle(ButtonStyle.Link);
        const row_buttons = new ActionRowBuilder().addComponents(
          downloadButton,
          botInviteButton
        );

        const menu = new StringSelectMenuBuilder()
          .setCustomId("models")
          .setPlaceholder(`🔎 ${results.length} models found...`)
          .setOptions(options);

        const row_menu = new ActionRowBuilder().addComponents(menu);

        interaction.update({
          embeds: [embed],
          components: [row_menu, row_buttons],
        });
      }
    });
  },
};
