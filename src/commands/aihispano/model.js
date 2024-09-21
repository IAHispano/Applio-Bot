const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("model")
		.setDescription("AI Hispano » Start the verification of your model.")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Enter the name of the model you want to upload.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("link")
				.setDescription("Enter the link to the model you want to upload.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("epochs")
				.setDescription("Enter the number of epochs of the model.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("algorithm")
				.setDescription("Select the algorithm for extracting the tone.")
				.addChoices(
					{ name: "Crepe", value: "Crepe" },
					{ name: "Crepe-tiny", value: "Crepe-tiny" },
					{ name: "Rmvpe", value: "Rmvpe" },
				)
				.setRequired(true),
		)
		.addAttachmentOption((option) =>
			option
				.setName("image")
				.setDescription("Upload a rectangular, high-quality image of the model.")
				.setRequired(true),
		)
		.addAttachmentOption((option) =>
			option
				.setName("audio")
				.setDescription("Upload a sample audio of the model.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("language")
				.setDescription("Select the language of the model.")
				.addChoices(
					{ name: "🇺🇸 English", value: "🇺🇸 English" },
					{ name: "🇪🇸 Spanish", value: "🇪🇸 Spanish" },
					{ name: "🇲🇽 Latin America", value: "🇲🇽 Latin America" },
					{ name: "🌎 Other languages", value: "🌎 Other languages" },
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("tags")
				.setDescription("Select the tag that best describes your model.")
				.addChoices(
					{ name: "🤣 Meme", value: "🤣 Meme" },
					{ name: "🎤 Artist", value: "🎤 Artist" },
					{ name: "👀 Character", value: "👀 Character" },
					{ name: "🎷 Instrument", value: "🎷 Instrument" },
					{ name: "🪁 Anime", value: "🪁 Anime" },
					{ name: "🛡️ TITAN-Medium", value: "🛡️ TITAN-Medium" },
					{ name: "🔝 High-Quality", value: "🔝 High-Quality" },
					{ name: "📑 TTS", value: "📑 TTS" },
					{ name: "⚡ w-okada", value: "⚡ w-okada" },
				)
				.setRequired(true),
		)
		.setDMPermission(false),

	async execute(interaction) {
		if (interaction.channel.parentId !== "1287038119677395059")
			return await interaction.reply({
				content: "This channel is not allowed for this action.",
				ephemeral: true,
			});

		const algorithm = interaction.options.getString("algorithm");
		const language = interaction.options.getString("language");
		const tags = interaction.options.getString("tags");
		const epochs = interaction.options.getString("epochs");
		const name = interaction.options.getString("name");
		const link = interaction.options.getString("link");
		const image = interaction.options.get("image");
		const imageURL = image?.attachment?.url || "https://upload.wikimedia.org/wikipedia/commons/7/75/No_image_available.png";
		const audio = interaction.options.get("audio");
		const audioURL = audio?.attachment?.url;

		const userId = interaction.user.id;
		const username = interaction.user.username;

		const viewAudioButton = new ButtonBuilder()
			.setLabel("🎵 View Audio")
			.setStyle(ButtonStyle.Link)
			.setURL(`https://audio-player-qtacpmvp5-deiants-projects.vercel.app/?link=${audioURL}`);

		const editPostButton = new ButtonBuilder()
			.setLabel("🔨 Edit Post")
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`epost_${userId}`);

		const uploadButton = new ButtonBuilder()
			.setLabel("⬆️ Upload Model")
			.setStyle(ButtonStyle.Primary)
			.setCustomId("mupload");

		const row = new ActionRowBuilder().addComponents(viewAudioButton, editPostButton, uploadButton);

		const embed = new EmbedBuilder()
			.setTitle(`New model by ${username}`)
			.addFields(
				{ name: "Title", value: name, inline: true },
				{ name: "Epochs", value: epochs, inline: true },
				{ name: "Algorithm", value: algorithm, inline: true },
				{ name: "Link", value: link, inline: true },
			)
			.setDescription(`### Model Information\n\`\`\`${name} (RVC [${algorithm}] - ${epochs} Epochs)\n${link}\n\nModel created by <@${userId}>\`\`\`\n> **Tags:** ${language}, ${tags}`)
			.setImage(imageURL)
			.setColor("White")
			.setFooter({ text: "Thank you for submitting your model!" })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
