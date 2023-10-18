const { Events, EmbedBuilder } = require("discord.js");
const { devs } = require("../config.json")

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (command.devOnly && interaction.user.id !== devs) {
      return interaction.reply({
          embeds: [
              new EmbedBuilder()
                  .setColor("Red")
                  .setDescription('This command is for Develepors only')
          ],
          ephemeral: true
      })
  }

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  },
};
