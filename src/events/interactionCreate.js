const { Events, EmbedBuilder } = require("discord.js");
const Blacklist = require("../schemas/moderation/blackList.js");
const client = require("../bot.js");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

    try {
      await handlePermissions(command, interaction, channel);
      await executeCommand(command, interaction, channel);
    } catch (error) {
      await handleCommandError(error, interaction, channel);
    }
  },
};

async function handlePermissions(command, interaction, channel) {
  if (
    command.devOnly &&
    !process.env.OWNER_IDS.split(",").includes(interaction.user.id)
  ) {
    interaction.reply("This command is restricted to developers.");
  }

  const blacklistedUser = await Blacklist.findOne({ Id: interaction.user.id });
  if (blacklistedUser) {
    throw new Error("You are blacklisted from using this command.");
  }
}

async function executeCommand(command, interaction, channel) {
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(
      `An error occurred while executing ${interaction.commandName}: ${error.stack}`,
    );
  }
}

async function handleCommandError(error, interaction, channel) {
  console.error(error);

  try {
    const error_embed = new EmbedBuilder()
      .setColor("Red")
      .setTimestamp()
      .setTitle("Command Execution Error")
      .setDescription("An error occurred while executing the command.")
      .addFields(
        { name: "Error stack", value: `\`\`\`${error.stack}\`\`\`` },
        { name: "Error message", value: `\`\`\`${error.message}\`\`\`` },
      );

    await channel.send({ embeds: [error_embed] });
  } catch (sendError) {
    console.error("Sending error information to the log channel failed.");
  }

  await interaction.reply({
    content:
      "There was an error while executing this command. Please try again later.",
    ephemeral: true,
  });
}
