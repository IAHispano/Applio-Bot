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

function searchSimilarities(searchedName, data) {
  const results = [];
  data.forEach((item) => {
    if (item.context && item.context.Name) {
      const name = item.context.Name;
      if (name.toLowerCase().includes(searchedName.toLowerCase())) {
        results.push({
          name: name,
          id: item.id,
          owner: item.owner,
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
  });

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
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const model = interaction.options.getString("model");

    if (!model) {
      await interaction.reply("Please provide the model name.");
      return;
    }

    const directory = "./models";

    fs.readdir(directory, async (err, files) => {
      if (err) {
        console.error("Error reading the directory:", err);
        return;
      }

      const data = [];

      files.forEach((file) => {
        if (path.extname(file) === ".json") {
          const content = fs.readFileSync(path.join(directory, file), "utf8");
          data.push(JSON.parse(content));
        }
      });

      const results = searchSimilarities(model, data);

      if (results.length === 0) {
        const embed = new EmbedBuilder()
          .setDescription(`No results found for the search ${model}...`)
          .setColor("#5865F2")
          .setFooter({
            text: `Powered by Applio — Make sure you spelled it correctly!`,
          });
        await interaction.reply({ embeds: [embed], ephemeral: true });
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
            {
              name: "Uploaded",
              value: `${result.uploadDate}`,
              inline: true,
            },
            {
              name: "Author",
              value: `[Click to view](https://discordapp.com/users/${result.owner})`,
              inline: true,
            },
          ];
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
          embed.addFields(fields);
        }

        const botInviteButton = new ButtonBuilder()
          .setLabel("🤖 Bot Invite")
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`,
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
          botInviteButton,
        );

        interaction.reply({
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
            `${results.indexOf(result) + 1}-${result.id}-${
              result.uploadDate
            }` === interaction.values[0],
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
            {
              name: "Uploaded",
              value: `${selectedResult.uploadDate}`,
              inline: true,
            },
            {
              name: "Author",
              value: `[Click to view](https://discordapp.com/users/${selectedResult.owner})`,
              inline: true,
            },
          ];

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
          embed.addFields(fields);

          const botInviteButton = new ButtonBuilder()
            .setLabel("🤖 Bot Invite")
            .setURL(
              `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`,
            )
            .setStyle(ButtonStyle.Link);
          const row_buttons = new ActionRowBuilder().addComponents(
            downloadButton,
            botInviteButton,
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
    });
  },
};
