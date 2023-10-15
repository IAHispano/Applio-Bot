const { SlashCommandBuilder, EmbedBuilder, Message } = require("discord.js");
const moderatorRoleID = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inactivity")
    .setNameLocalizations({
      "es-ES": "inactividad",
    })

    .setDescription(
      "AI Hispano » Set yourself as inactive for a period of time (Moderators only).",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "AI Hispano » Establécete como inactivo durante un tiempo (Sólo moderadores).",
    })
    .addStringOption((op) =>
      op
        .setName("time")
        .setDescription("Set the time you will be inactive for.")
        .setRequired(true),
    )
    .addStringOption((op) =>
      op
        .setName("reason")
        .setDescription("Set the reason for your inactivity.")
        .setRequired(true),
    ),

  async execute(interaction) {
    const time = interaction.options.get("time").value;
    const reason = interaction.options.get("reason").value;
    const author = interaction.user.username;

    const member = interaction.member;
    if (member.roles.cache.some((role) => role.id === moderatorRoleID)) {
      const embed = new EmbedBuilder()
        .setTitle("New absence from " + author)
        .addFields(
          { name: "**Time**", value: `${time}`, inline: true },
          { name: "**Reason**", value: `${reason}`, inline: true },
        )
        .setFooter({ text: "We look forward to having you back soon!" })
        .setColor("#5865F2")
        .setTimestamp();

      const message = await interaction.reply({
        embeds: [embed],
        fetchReply: true,
      });

      if (message instanceof Message) {
        await message.react("😭");
      } else {
        console.log("There was an error reacting to the message.");
      }
    } else {
      await interaction.reply("You don't have permission to use this command.");
    }
  },
};
