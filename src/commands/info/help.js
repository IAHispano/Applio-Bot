const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { clientId, bot_perms } = require("../../config.json");

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
    const commands = interaction.client.commands;

    const groupedCommands = {
      "AI": [],
      "AI Hispano": [],
      "Info": [],
      "Moderation": [],
      "RVC": [],
      "Utility": [],
    };

    commands.forEach((command) => {
      const description = command.data.description;
      if (description.startsWith("AI »")) {
        groupedCommands["AI"].push(command);
      } else if (description.startsWith("AI Hispano »")) {
        groupedCommands["AI Hispano"].push(command);
      } else if (description.startsWith("Info »")) {
        groupedCommands["Info"].push(command);
      } else if (description.startsWith("Moderation »")) {
        groupedCommands["Moderation"].push(command);
      } else if (description.startsWith("RVC »")) {
        groupedCommands["RVC"].push(command);
      } else if (description.startsWith("Utility »")) {
        groupedCommands["Utility"].push(command);
      }
    });

    const helpMessage = new EmbedBuilder()
      .setTitle("Help")
      .setDescription("Applio is a bot that has a lot of features, such as moderation, fun, utility, and more.");

    const categories = Object.keys(groupedCommands);

    categories.forEach((category) => {
      if (groupedCommands[category].length > 0) {
        const commandList = groupedCommands[category]
          .map((command) => `- **/${command.data.name}**: ${command.data.description}`)
          .join("\n");
        helpMessage.addFields({
          name: category,
          value: commandList,
        })
      }
    });

    helpMessage
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor("Blurple")
      .setTimestamp();

    const botInviteButton = new ButtonBuilder()
      .setLabel("Bot Invite")
      .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`)
      .setStyle(ButtonStyle.Link);

    const supportServerButton = new ButtonBuilder()
      .setLabel("Support Server")
      .setURL("https://discord.gg/IAHispano")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(botInviteButton, supportServerButton);

    await interaction.reply({
      embeds: [helpMessage],
      components: [row],
      ephemeral: true,
    });
  },
};
