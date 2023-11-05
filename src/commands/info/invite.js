const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { client_id, bot_perms } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setNameLocalizations({
      "es-ES": "invitar",
    })

    .setDescription(
      "Info » Get the invitation to have the Applio bot on your server.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "Info » Consigue la invitación para tener el bot de Applio en tu servidor.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Applio — Invite")
      .setDescription(
        `[Click on this message to invite the bot to your server!](https://discord.com/api/oauth2/authorize?client_id=${client_id}&permissions=${bot_perms}&scope=bot)`,
      )
      .setColor("White")
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  },
};
