const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
        .setRequired(true),
    ),

  async execute(interaction) {
    const model = interaction.options.getString("model");

    if (!model) {
      await interaction.reply("Please provide a model name.");
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

      const embed = new EmbedBuilder()
        .setTitle(`Models found with the search ${model}`)
        .setColor("#5865F2")
        .setFooter({
          text: `Powered by Applio — ${results.length} models found`,
        })
        .setTimestamp();

      let description = "";

      for (let i = 0; i < Math.min(results.length, 5); i++) {
        const result = results[i];
        description += `
[**${result.name}**](${result.link})
<:dot:1134526388456669234> **Epochs:** ${result.epoch}
<:dot:1134526388456669234> **Technology:** ${result.type}
<:dot:1134526388456669234> **Algorithm:** ${result.algorithm}
<:dot:1134526388456669234> **Uploaded:** ${result.uploadDate}
<:dot:1134526388456669234> **Author:** [Click to view](https://discordapp.com/users/${result.owner})\n`;
      }

      if (
        results[0].attachments &&
        results[0].attachments[0] &&
        results[0].attachments[0].url
      ) {
        embed.setImage(results[0].attachments[0].url);
      }

      embed.setDescription(description);

      await interaction.reply({
        embeds: [embed],
      });
    });
  },
};
