const { Events, EmbedBuilder } = require("discord.js");

const client = require("../bot.js");
const prefix = "<@1144714449563955302>"
module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (!message.content.startsWith(prefix) || message.author.bot || message.content.length < 1) return;

    let args = message.content.toLowerCase().substring(prefix.length).split(" ");
    if (!args[1] || !args[1].trim()) {
      
      return
    } else if (!args[1].toLowerCase().includes("search")) {
      return
    }
    const command = message.client.commands.get(args[1]);
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    

    try {
      await handlePermissions(command, message, channel);
      await executeCommand(command, message, channel);
    } catch (error) {
      await handleCommandError(error, message, channel);
    }
  },
};

async function handlePermissions(command, message, channel) {


}

async function executeCommand(command, message, channel) {
  let content = message.content.slice(prefix.length).trim();

  message.options = {
    getString: () => content
  };
  // message.reply = function(messageOptions) {
  //   return this.channel.send(messageOptions);
  // };
  message.followUp = function(messageOptions) {
    return this.channel.send(messageOptions);
  };
  message.deferReply = async function(messageOptions) {
    const sentMessage = await this.channel.send({content: "Loading...", reply: { messageReference: message.id }});
    this.sentMessageId = sentMessage.id; 
    return sentMessage;
  };
  message.deferReply.edit = async function(messageOptions) {
    if (!this.sentMessageId) {
        console.error("Dont Found.");
        return;
    }
    const sentMessage = await this.channel.messages.fetch(this.sentMessageId);
    if (!sentMessage) {
        console.error("Dont Found.");
        return;
    }
    await sentMessage.edit(messageOptions);
  };
  message.user = message.author
  if (!command) {
    const command = message.client.commands.get("chat");
    await command.execute(message, client);
    return;
  }
  content = content.replace(/^searchuser\b|^search\b/i, "").trim();
  message.options = {
    getString: () => content
  };

  try {
    await command.execute(message, client);
  } catch (error) {
    console.error(
      `An error occurred while executing ${message}: ${error.stack}`,
    );
  }
}

async function handleCommandError(error, message, channel) {
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

  await message.reply({
    content:
      "There was an error while executing this command. Please try again later.",
    ephemeral: true,
  });
}
