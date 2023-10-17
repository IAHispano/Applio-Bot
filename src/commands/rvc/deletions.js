const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletions")
    .setNameLocalizations({
      "es-ES": "eliminaciones",
    })

    .setDescription("RVC » Requests the removal of a model from the database.")
    .setDescriptionLocalizations({
      "es-ES":
        "RVC » Solicita la eliminación de un modelo de la base de datos.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Applio — Deletions")
      .setDescription(
        `Join the support server and let us know which model you want to remove and it will be removed without any problem!\n\n[Support Server](https://discord.gg/IAHispano)`,
      )
      .setColor(Colors.White)
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
