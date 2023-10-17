const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
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
          owner: item.owner,
          link: item.links[0].Link,
          epoch:
            item.context.Epoch !== undefined && item.context.Epoch !== null
              ? item.context.Epoch
              : "Not specified",
          algorithm:
            item.context.Algorithm !== undefined &&
            item.context.Algorithm !== null
              ? item.context.Algorithm
              : "Not specified",
          type:
            item.context.Type !== undefined && item.context.Type !== null
              ? item.context.Type
              : "Not specified",
          uploadDate: item.upload
            ? new Date(item.upload).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "Not specified",
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
        .setDescription("Enter the name of the model you wish to search for.")
        .setRequired(true)
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
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const pageSize = 1;
      const totalPages = results.length;
      let currentPage = 1;

      const displayPage = (page) => {
        const startIdx = (page - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, results.length);
      
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
      
          const description = `
              [**${result.name}**](${result.link})
              <:dot:1134526388456669234> **Epochs:** ${result.epoch}
              <:dot:1134526388456669234> **Technology:** ${result.type}
              <:dot:1134526388456669234> **Algorithm:** ${result.algorithm}
              <:dot:1134526388456669234> **Uploaded:** ${result.uploadDate}
              <:dot:1134526388456669234> **Author:** [Haga clic para ver](https://discordapp.com/users/${result.owner})\n`;
      
          if (
            result.attachments &&
            result.attachments[0] &&
            result.attachments[0].url
          ) {
            embed.setImage(result.attachments[0].url);
          }
          
          embed.setTitle(result.name)
          embed.setDescription(description);
        }
      
        const row = new ActionRowBuilder();
      
        const options = results.slice(0, 25).map((result, index) => ({
          label: `${result.name} [${index}]`,
          value: `${result.name}-${result.owner}`, 
          emoji: "<:dot:1134526388456669234>",
        }));
      
        const menu = new StringSelectMenuBuilder()
          .setCustomId("models")
          .setPlaceholder("Select a model...")
          .setOptions(options);
          
      
        row.addComponents(menu);
      
        interaction.reply({
          embeds: [embed],
          components: [row],
        });
      };
      

      displayPage(currentPage);

      let collector;

      collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
      });

      collector.on("collect", async (interaction) => {
        const selectedResult = results.find(
          (result) => `${result.name}-${result.owner}` === interaction.values[0]
        );

        if (selectedResult) {
          const embed = new EmbedBuilder()
            .setTitle(selectedResult.name)
            .setColor("#5865F2")
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setColor("#5865F2")
            .setTimestamp();
      

          const description = `
              [**${selectedResult.name}**](${selectedResult.link})
              <:dot:1134526388456669234> **Epochs:** ${selectedResult.epoch}
              <:dot:1134526388456669234> **Technology:** ${selectedResult.type}
              <:dot:1134526388456669234> **Algorithm:** ${selectedResult.algorithm}
              <:dot:1134526388456669234> **Uploaded:** ${selectedResult.uploadDate}
              <:dot:1134526388456669234> **Author:** [Haga clic para ver](https://discordapp.com/users/${selectedResult.owner})\n`;

          if (
            selectedResult.attachments &&
            selectedResult.attachments[0] &&
            selectedResult.attachments[0].url
          ) {
            embed.setImage(selectedResult.attachments[0].url);
          }

          embed.setDescription(description);

          interaction.update({
            embeds: [embed],
          });
        }
      });
    });
  },
};
