const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("UTILITY » Replies with Pong!")
    .setDescriptionLocalizations({
      "es-ES": "UTILITY » Responde con un Pong!",
    }),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};
