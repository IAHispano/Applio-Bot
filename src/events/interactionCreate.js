const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const User = require("../schemas/premium/premiumUser.js");
const Blacklist = require("../schemas/moderation/blackList.js");
const client = require("../bot.js");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
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
              "This command is only available to premium users. You can get premium by redeeming a code with `/premium-redeem`.",
            ),
        ],
        ephemeral: true,
      });
    }

    if (command.devOnly && interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "Currently the use of this command is restricted, it may be in maintenance or experimental phases.",
            ),
        ],
        ephemeral: true,
      });
    }

    const blacklistedUser = await Blacklist.findOne({
      Id: interaction.user.id,
    });
    if (blacklistedUser) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "You are blacklisted from using Applio. If you think this is a mistake, please contact the developer.",
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("🛠️ Appeal")
              .setURL("https://discord.gg/IAHispano")
              .setStyle(ButtonStyle.Link),
          ),
        ],
        ephemeral: true,
      });
    }

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      try {
        const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

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
            { name: "Error message", value: `\`\`\`${error.message}\`\`\`` },
          );

        await channel
          .send({
            embeds: [embed],
          })
          .then(
            console.log(
              `An error occurred while executing ${interaction.commandName}:\n${error.stack}`,
            ),
          );
      } catch (error) {
        console.error(error);
      }

      await interaction.reply({
        content: `There was an error while executing this command. I have sent your crash report to the support server. If this persists, please contact the developer by making a support request.\nCheck that the bot has the necessary permissions to execute the command, if you are not sure [re-invite it from this link!](https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot)`,
        ephemeral: true,
      });
    }
  },
};
