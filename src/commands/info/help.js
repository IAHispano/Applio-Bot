const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setNameLocalizations({
      "es-ES": "ayuda",
    })

    .setDescription("Info » Get help with the bot commands.")
    .setDescriptionLocalizations({
      "es-ES": "Info » Obten ayuda sobre los comandos del bot.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    const embed_principal = new EmbedBuilder()
      .setTitle("Help")
      .setDescription(
        "Applio is a bot that has a lot of features, such as moderation, fun, utility, and more."
      )
      .addFields(
        {
          name: "Support",
          value: "https://discord.gg/IAHispano",
        },
        {
          name: "Invite",
          value: "https://bot.applio.org",
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor("#5865F2")
      .setTimestamp();

    await interaction.reply({
      embeds: [embed_principal],
      ephemeral: true,
    });
  },
};
