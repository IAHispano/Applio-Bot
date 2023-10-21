const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Moderation » Ban a user from the server (Moderators only)."
    )
    .setDescriptionLocalizations({
      "es-ES":
        "Moderation » Banea a un usuario del servidor (Sólo moderadores).",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")

        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription("Select the user to ban.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona el usuario a banear.",
        })
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setNameLocalizations({
          "es-ES": "razón",
        })
        .setDescription("Reason for the ban of this user.")
        .setDescriptionLocalizations({
          "es-ES": "Razón por la que se banea a este usuario.",
        })
        .setMaxLength(512)
    ),

  async execute(interaction) {
    const { guild } = interaction;
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Not specified";

    if (!user) {
      interaction.reply("The user has most likely left the server.");
      return;
    }

    const memberToBan = guild.members.cache.get(user.id);

    if (!memberToBan) {
      interaction.reply({
        content: "The specified user is not a member of this server.",
      });
      return;
    }

    if (!memberToBan.manageable || !memberToBan.bannable) {
      interaction.reply({
        content: "This bot cannot moderate the selected user.",
      });
      return;
    }

    try {
      await memberToBan.ban({ reason: reason });

      interaction.reply({
        content: `${user} has been successfully banned: ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "An error occurred while trying to ban the user.",
        ephemeral: true,
      });
    }
  },
};
