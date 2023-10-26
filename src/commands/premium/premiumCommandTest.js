const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../schemas/premium/premiumUser.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setDMPermission(false)
    .setName("premium-check")
    .setDescription("Premium » Check if you have premium.")
    .setDescriptionLocalizations({
      "es-ES": "Premium » Comprueba si tienes premium.",
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
