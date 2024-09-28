const {
	Events,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} = require("discord.js");

const client = require("../bot.js");
const prefix = `<@${process.env.BOT_ID}>`;

module.exports = {
	name: "messageCreate",
	once: false,
	async execute(message) {
		if (message.author.bot || !message.content) return;

		if (message.type === 19 && message.reference) {
			await handleReplyMessage(message);
		} else {
			await handleCommandMessage(message);
		}
	},
};

async function handleReplyMessage(message) {
	const msg = await message.fetchReference();
	if (msg.embeds.length > 0) return;

	message.applioRefer = msg.content;

	if (msg.author.id === process.env.BOT_ID) {
		message.content = `${message.author.username}: ${message.content}`;
	} else {
		if (!message.content.startsWith(prefix)) return;
		message.content = message.content.slice(prefix.length).trim();
		message.content = `${msg.author.username}: ${msg.content} | ${message.author.username}: ${message.content}`;
	}

	const command = message.client.commands.get("chat");
	await executeCommand(command, message);
}

async function handleCommandMessage(message) {
	if (!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(" ");
	const commandName = args[0];
	if (!commandName) {
		const embed = new EmbedBuilder()
			.setTitle("Applio Bot")
			.setDescription(
				"Applio is a Voice Conversion based on VITS focused on simplicity, quality and performance, if you need to know more about it, you can check [Website](https://applio.org) or [Github](https://github.com/IAHispano/Applio). \n Commands: \n - </search:1229146911483760781>\n- </searchuser:1232443891513561141>\n- </chat:1234277316994007040> \n*And More...*",
			);
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL("https://discord.gg/IAHispano")
				.setLabel("Support")
				.setEmoji("🤔"),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL(
					"https://discord.com/api/oauth2/authorize?client_id=1144714449563955302&permissions=1376674433127&scope=bot",
				)
				.setLabel("Invite")
				.setEmoji("📤"),
		);
		await message.channel.send({ embeds: [embed], components: [row] });
		return;
	}

	const command = message.client.commands.get(commandName);
	const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

	try {
		await executeCommand(command, message);
	} catch (error) {
		await handleCommandError(error, message, channel);
	}
}

async function executeCommand(command, message) {
	if (!command) {
		command = message.client.commands.get("chat");
	}
	const content = message.content.startsWith(prefix)
		? message.content.slice(prefix.length).trim()
		: message.content;

	message.options = { getString: () => content };

	message.followUp = async function (messageOptions) {
		return this.sentMessageId
			? this.channel.send({
					...messageOptions,
					reply: { messageReference: this.sentMessageId },
				})
			: this.channel.send(messageOptions);
	};

	message.deferReply = async function () {
		const sentMessage = await this.channel.send({
			content: "<a:loading:1286734108956823594>",
			reply: { messageReference: message.id },
		});
		this.sentMessageId = sentMessage.id;
		return sentMessage;
	};

	message.editReply = async function (messageOptions) {
		if (!this.sentMessageId) return;
		const sentMessage = await this.channel.messages.fetch(this.sentMessageId);
		if (sentMessage) await sentMessage.edit(messageOptions);
	};

	message.user = message.author;

	if (/^searchuser\b|^search\b/i.test(content)) {
		message.options = {
			getString: () => content.replace(/^searchuser\b|^search\b/i, "").trim(),
		};
	}

	await command.execute(message, client);
}

async function handleCommandError(error, message, channel) {
	console.error(error);

	const errorEmbed = new EmbedBuilder()
		.setColor("White")
		.setTimestamp()
		.setTitle("Command Execution Error")
		.setDescription("An error occurred while executing the command.")
		.addFields(
			{ name: "Error stack", value: `\`\`\`${error.stack}\`\`\`` },
			{ name: "Error message", value: `\`\`\`${error.message}\`\`\`` },
		);

	try {
		await channel.send({ embeds: [errorEmbed] });
	} catch (sendError) {
		console.error("Failed to send error info to the log channel.");
	}

	await message.reply({
		content:
			"There was an error while executing this command. Please try again later.",
		ephemeral: true,
	});
}
