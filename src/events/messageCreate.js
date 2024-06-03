const {
  Events,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");

const client = require("../bot.js");
const prefix = `<@${process.env.BOT_ID}>`;
module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot || message.content.length < 1) return;
    let command;
    if (message.type === 19 && message.reference) {
      const msg = await message.fetchReference();
      message.applioReplied = message.content;
      message.applioReference = msg.content;
      if (msg.author.id === process.env.BOT_ID) {
        new_ = `What you said before: ${msg.content} What I answer: ${message.content}`;
        message.content = new_;
        command = message.client.commands.get("chat");
      } else {
        if (!message.content.startsWith(prefix)) return;
        message.content = message.content.slice(prefix.length).trim();
        new_ = `Friend's question ${msg.author.username} said: "${msg.content}" (You can talk about ${msg.author.username} since it is a conversation between me and him and I want to share it with you.) I ask you with respect to the above (Me): "${message.content}" Your opinion on this matter:`;
        message.content = new_;
        command = message.client.commands.get("chat");
      }
    } else {
      if (!message.content.startsWith(prefix)) return;
      let args = message.content
        .toLowerCase()
        .substring(prefix.length)
        .split(" ");
      if (!args[1] || !args[1].trim()) {
        let embed = new EmbedBuilder()
          .setTitle("Applio Bot")
          .setDescription(
            "Applio is a Voice Conversion based on VITS focused on simplicity, quality and performance, if you need to know more about it, you can check [Website](https://applio.org) or [Github](https://github.com/IAHispano/Applio). \n Commands: \n - </search:1229146911483760781>\n- </searchuser:1232443891513561141>\n- </chat:1234277316994007040> \n*And More...*",
          );
        const invite = new ButtonBuilder()
          .setStyle(5)
          .setURL("https://discord.gg/IAHispano")
          .setLabel("Discord Support")
          .setEmoji("⚙️");
        const inviteBot = new ButtonBuilder()
          .setStyle(5)
          .setURL(
            "https://discord.com/api/oauth2/authorize?client_id=1144714449563955302&permissions=1376674433127&scope=bot",
          )
          .setLabel("Invite")
          .setEmoji("🪛");

        const row = new ActionRowBuilder().addComponents(invite, inviteBot);
        await message.channel.send({ embeds: [embed], components: [row] });
        return;
      }
      command = message.client.commands.get(args[1]);
    }

    const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

    try {
      await executeCommand(command, message, channel);
    } catch (error) {
      await handleCommandError(error, message, channel);
    }
  },
};

async function executeCommand(command, message, channel) {
  let content;
  if (message.content.includes(prefix)) {
    content = message.content.slice(prefix.length).trim();
  } else {
    content = message.content;
  }

  message.options = {
    getString: () => content,
  };
  // message.reply = function(messageOptions) {
  //   return this.channel.send(messageOptions);
  // };
  message.followUp = function (messageOptions) {
    return this.channel.send(messageOptions);
  };
  message.deferReply = async function (messageOptions) {
    const sentMessage = await this.channel.send({
      content: "Loading...",
      reply: { messageReference: message.id },
    });
    this.sentMessageId = sentMessage.id;
    return sentMessage;
  };
  message.deferReply.edit = async function (messageOptions) {
    if (!this.sentMessageId) {
      console.error("Unknown message id.");
      return;
    }
    const sentMessage = await this.channel.messages.fetch(this.sentMessageId);
    if (!sentMessage) {
      console.error("Unknown message.");
      return;
    }
    await sentMessage.edit(messageOptions);
  };
  message.update = message.edit;
  message.user = message.author;

  if (
    !command ||
    !/^searchuser\b|^search\b/i.test(content) ||
    command.data.name === "chat"
  ) {
    const command = message.client.commands.get("chat");
    await command.execute(message, client);
    return;
  }
  content = content.replace(/^searchuser\b|^search\b/i, "").trim();
  message.options = {
    getString: () => content,
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
