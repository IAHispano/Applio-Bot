const { SlashCommandBuilder } = require("discord.js");
const Blacklist = require("../../schemas/moderation/blackList.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription(
      "Utility » Blacklist or remove users from the bot's blacklist (Developers only).",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "Utility » Añade o elimina usuarios de la blacklist del bot (Sólo desarrolladores).",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setNameLocalizations({
          "es-ES": "añadir",
        })
        .setDescription("Blacklist a user.")
        .setDescriptionLocalizations({
          "es-ES": "Añade un usuario a la blacklist.",
        })
        .addUserOption((option) =>
          option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("The user to be blacklisted.")
            .setDescriptionLocalizations({
              "es-ES": "El usuario que quieres añadir a la blacklist.",
            })
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setNameLocalizations({
              "es-ES": "razón",
            })
            .setDescription("Reason for blacklisting")
            .setDescriptionLocalizations({
              "es-ES": "Razón por la que se añade a la blacklist",
            }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a user from the blacklist")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to be removed from the blacklist")
            .setRequired(true),
        ),
    )
    .setDMPermission(false),
  devOnly: true,
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason";

      try {
        const existingEntry = await Blacklist.findOne({ userId: user.id });

        if (existingEntry) {
          await interaction.reply(`${user.username} is already blacklisted.`);
        } else {
          const newEntry = new Blacklist({ userId: user.id, reason });
          await newEntry.save();

          await interaction.reply(
            `${user.username} has been blacklisted. Reason: ${reason}`,
          );
        }
      } catch (error) {
        console.error("Error occurred while adding user to blacklist:", error);
        await interaction.reply(
          "An error occurred while adding the user to the blacklist.",
        );
      }
    } else if (subcommand === "remove") {
      const user = interaction.options.getUser("user");

      try {
        const removedEntry = await Blacklist.findOneAndDelete({
          userId: user.id,
        });

        if (removedEntry) {
          await interaction.reply(
            `${user.username} has been removed from the blacklist.`,
          );
        } else {
          await interaction.reply(`${user.username} is not blacklisted.`);
        }
      } catch (error) {
        console.error(
          "Error occurred while removing user from blacklist:",
          error,
        );
        await interaction.reply(
          "An error occurred while removing the user from the blacklist.",
        );
      }
    }
  },
};
