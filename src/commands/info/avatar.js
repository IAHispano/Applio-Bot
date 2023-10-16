const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")

    .setDescription("INFO » Get the avatar of a user or yourself.")
    .setDescriptionLocalizations({
      "es-ES": "INFO » Obtén el avatar de un usuario o de ti mismo.",
    })
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Specify the user you want to get the avatar from (if you want yours, don't put anything)."
        )
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`${user.tag}'s avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096}))
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL()})
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};
