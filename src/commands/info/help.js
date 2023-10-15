const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setNameLocalizations({
      "es-ES": "ayuda",
    })

    .setDescription("INFO » Get help with the bot commands.")
    .setDescriptionLocalizations({
      "es-ES": "INFO » Obten ayuda sobre los comandos del bot.",
    }),
  async execute(interaction) {
    const embed_principal = new EmbedBuilder()
      .setTitle("🚀 Help")
      .setColor("#FFFFFF")
      .setFooter({
        text: "Thank you for using our bot! If you have more questions, feel free to ask.",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed_principal],
    });
  },
};
