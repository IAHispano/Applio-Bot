const User = require("../../schemas/premium/premiumUser.js");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium-remove")
    .setDMPermission(false)
    .setDescription("Premium » Remove premium from a user (Developers only).")
    .setDescriptionLocalizations({
      "es-ES":
        "Premium » Elimina premium de un usuario (Sólo desarrolladores).",
    })
    .addUserOption((option) =>
      option
        .setName("user")
        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription("The user you want to remove premium from.")
        .setDescriptionLocalizations({
          "es-ES": "El usuario al que quieres eliminar premium.",
        })
        .setRequired(true)
    ),
  devOnly: true,
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const userpre = await User.findOne({ Id: interaction.user.id });
    userpre.isPremium = false;
    userpre.PremID = null;
    userpre.redeemedAt = null;
    userpre.expiresAt = null;
    userpre.plan = null;
    userpre.save();
    embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`Removed Premium from ${user}`);
    await interaction.reply({ embeds: [embed] });
  },
};
