const { Events, EmbedBuilder } = require("discord.js");
const { devs, logsChannelId, clientId, bot_perms } = require("../config.json");
const User = require("../schemas/premiumUser.js");
const client = require("../bot.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    const user = await User.findOne({ Id: interaction.user.id });
    if (command.premiumOnly && (!user || !user.isPremium)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "This command is only available to premium users. You can get premium by redeeming a code with `/premium-redeem`."
            ),
        ],
        ephemeral: true,
      });
    }

    if (command.devOnly && interaction.user.id !== devs) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "Currently the use of this command is restricted, it may be in maintenance or experimental phases."
            ),
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
      try {
        const channel = client.channels.cache.get(logsChannelId);

        const embed = new EmbedBuilder()
          .setColor("Red")
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
      } catch (error) {
        console.error(error);
      }

      await interaction.reply({
        content: `There was an error while executing this command. I have sent your crash report to the support server. If this persists, please contact the developer by making a support request.\nCheck that the bot has the necessary permissions to execute the command, if you are not sure [re-invite it from this link!](https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot)`,
        ephemeral: true,
      });
    }
  },
};
