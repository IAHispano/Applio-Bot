const { Events, EmbedBuilder } = require("discord.js");
const { devs, logsChannelId } = require("../config.json");
const client = require("../bot.js");

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
            .setDescription("You are not allowed to use this command."),
        ],
        ephemeral: true,
      });
    }

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      const channel = client.channels.cache.get(logsChannelId);

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTimestamp()
        .setTitle("Command Execution Error")
        .setDescription("An error occurred while executing the command.")
        .addFields(
          {
            name: "Command",
            value: `\`\`\`${interaction.commandName}\`\`\``,
          },
          {
            name: "Executed by",
            value: `\`\`\`${interaction.user.username}\`\`\``,
          },
          { name: "Error stack", value: `\`\`\`${error.stack}\`\`\`` },
          { name: "Error message", value: `\`\`\`${error.message}\`\`\`` }
        );

      const message = await channel.send({
        embeds: [embed],
      });

      await interaction.reply({
        content:
          "There was an error while executing this command. I have sent your crash report to the support server. If this persists, please contact the developer by making a support request.",
        ephemeral: true,
      });
    }
  },
};
