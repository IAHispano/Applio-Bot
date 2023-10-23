const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../schemas/premium/premiumUser.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setDMPermission(false)
    .setName("premium-check")
    .setDescription("Check if you have Premium.")
    .setDescriptionLocalizations({
      "es-ES": "Comprueba si tienes Premium.",
    }),

  premiumOnly: true,
  async execute(interaction) {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blurple")
          .setDescription(`You are a premium user.`),
      ],
      ephemeral: true,
    });
  },
};
