const {
    SlashCommandBuilder,
    EmbedBuilder,
  } = require("discord.js");
  const { AddBlackList } = require("../../utils/blacklist"); // Ajusta la ruta según tu estructura de proyecto
  
  module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
      .setName("blacklist")
      .setDescription("Admin » Add a user to the blacklist.")
      .setDescriptionLocalizations({
        "es-ES": "Admin » Añadir un usuario a la lista negra.",
      })
      .setDMPermission(false)
      .addUserOption((option) =>
        option
          .setName("user")
          .setNameLocalizations({
            "es-ES": "usuario",
          })
          .setDescription("The user to be added to the blacklist.")
          .setDescriptionLocalizations({
            "es-ES": "El usuario a añadir a la lista negra.",
          })
          .setRequired(true),
      ),
  
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const userId = user.id;
      await AddBlackList(userId);
  
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Blacklisted")
            .setDescription(`${user.username} has been added to the blacklist.`)
            .setColor("Green"),
        ], ephemeral: true
      });
    },
  };
  