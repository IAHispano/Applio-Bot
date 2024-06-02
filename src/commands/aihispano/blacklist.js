const {
    SlashCommandBuilder,
    EmbedBuilder,
  } = require("discord.js");
  const { AddBlackList, IsInBlacklist, RemoveBlackList } = require("../../utils/blacklist"); 
  
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
      )
      .addStringOption((option => 
        option
        .setName('method')
        .setNameLocalizations({
            "es-ES": "Metodo",
          })
        .setDescription('Add Or Delete')
        .setDescriptionLocalizations({
            "es-ES": "Añadir o Eliminar.",
          })
        .setRequired(true)
        .addChoices(
            { name: 'Add', value: 'Add' },
            { name: 'Delete', value: 'Delete' },
        )
      )),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const userId = user.id;
    const method = interaction.options.getString("method");

    if (method === 'Add') {
      if (IsInBlacklist(userId)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Already Blacklisted")
              .setDescription(`${user.username} is already in the blacklist.`)
              .setColor("Yellow"),
          ],
          ephemeral: true,
        });
        return;
      }

      await AddBlackList(userId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Blacklisted")
            .setDescription(`${user.username} has been added to the blacklist.`)
            .setColor("Green"),
        ],
        ephemeral: true,
      });

    } else if (method === 'Delete') {
      if (!IsInBlacklist(userId)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Not Blacklisted")
              .setDescription(`${user.username} is not in the blacklist.`)
              .setColor("Yellow"),
          ],
          ephemeral: true,
        });
        return;
      }

      await RemoveBlackList(userId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Removed from Blacklist")
            .setDescription(`${user.username} has been removed from the blacklist.`)
            .setColor("Green"),
        ],
        ephemeral: true,
      });
    }
  },
};