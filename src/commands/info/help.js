const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");

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

		const groupedCommands = commands.reduce(
			(acc, command) => {
				const { description } = command.data;
				if (!command.devOnly) {
					if (description.startsWith("AI »")) acc.AI.push(command);
					else if (description.startsWith("AI Hispano »"))
						acc["AI Hispano"].push(command);
					else if (description.startsWith("Info »")) acc.Info.push(command);
					else if (description.startsWith("Moderation »"))
						acc.Moderation.push(command);
					else if (description.startsWith("Utility »"))
						acc.Utility.push(command);
				}
				return acc;
			},
			{ AI: [], "AI Hispano": [], Info: [], Moderation: [], Utility: [] },
		);

		const helpMessage = new EmbedBuilder()
			.setTitle("Help")
			.setDescription(
				"Applio is a bot with features like moderation, fun, utility, and more.",
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setColor("White")
			.setTimestamp();

		Object.keys(groupedCommands).forEach((category) => {
			const commandsInCategory = groupedCommands[category];
			if (commandsInCategory.length > 0) {
				const commandList = commandsInCategory
					.map(
						(command) =>
							`- **/${command.data.name}**: ${command.data.description}`,
					)
					.join("\n");
				helpMessage.addFields({ name: category, value: commandList });
			}
		});

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel("Bot Invite")
				.setURL(
					`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
				)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Support Server")
				.setURL("https://discord.gg/IAHispano")
				.setStyle(ButtonStyle.Link),
		);

		await interaction.reply({
			embeds: [helpMessage],
			components: [row],
			ephemeral: true,
		});
	},
};
