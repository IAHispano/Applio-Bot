const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../schemas/premium/premiumUser.js");
const Blacklist = require("../schemas/moderation/blackList.js");
const commandLog = require("../schemas/information/commandLog.js");
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
  const user = await User.findOne({ Id: interaction.user.id });
  if (command.premiumOnly && (!user || !user.isPremium)) {
    throw new Error("This command is only available to premium users.");
  }

  if (command.devOnly && interaction.user.id !== process.env.OWNER_ID) {
    throw new Error("This command is restricted to developers.");
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

    const now = new Date();
    const formattedTimestamp = `[${now.getDate()}/${
      now.getMonth() + 1
    }/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}]`;

    console.log(
      `${formattedTimestamp} ${interaction.user.username} (${interaction.user.id}): /${interaction.commandName} in "${interaction.guild.name}" (${interaction.guild.id}) #${interaction.channel.name} (${interaction.channel.id})`
    );

    const success_embed = new EmbedBuilder()
      .setColor("Green")
      .setTimestamp()
      .setTitle("Command Execution")
      .setDescription("The command was executed successfully.")
      .addFields(
        { name: "Command", value: `\`\`\`${interaction.commandName}\`\`\`` },
        {
          name: "Executed by",
          value: `\`\`\`${interaction.user.username} (${interaction.user.id})\`\`\``,
        },
        {
          name: "Guild",
          value: `\`\`\`${interaction.guild.name} (${interaction.guild.id})\`\`\``,
        },
        {
          name: "Channel",
          value: `\`\`\`${interaction.channel.name} (${interaction.channel.id})\`\`\``,
        }
      );

    await channel.send({ embeds: [success_embed] });

    await commandLog.create({
      commandName: interaction.commandName,
      userId: interaction.user.id,
      userName: interaction.user.username,
      guildName: interaction.guild.name,
      guildId: interaction.guild.id,
      channelName: interaction.channel.name,
      channelId: interaction.channel.id,
    });
  } catch (error) {
    console.error(
      `An error occurred while executing ${interaction.commandName}: ${error.stack}`
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
        { name: "Error message", value: `\`\`\`${error.message}\`\`\`` }
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
