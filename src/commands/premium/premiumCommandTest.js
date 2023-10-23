const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../schemas/premiumUser.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium-check")
    .setDescription("Check if you have Premium"),

  onlyPremium: true,
  async execute(interaction) {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Burple")
          .setDescription(`You are a premium user.`),
      ],
      ephemeral: true,
    });
  },
};
