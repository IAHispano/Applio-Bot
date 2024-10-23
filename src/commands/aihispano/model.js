const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

function normalizeEmojis(tags) {
	const emojiMap = {
		"🛡️": "🛡️",
		"🤣": "🤣",
		"🎤": "🎤",
		"👀": "👀",
		"🎷": "🎷",
		"🪁": "🪁",
		"🔝": "🔝",
		"📑": "📑",
		"⚡": "⚡",
	};

	return tags.map(tag => {
		return Object.keys(emojiMap).reduce((acc, emoji) => {
			const regex = new RegExp(emoji.replace(/[\uFE0F\uFE0E]/g, ''));
			return acc.replace(regex, emojiMap[emoji]);
		}, tag);
	});
}
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
				.setDescription(
					"Upload a rectangular, high-quality image of the model.",
				)
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
				.setAutocomplete(true)
				.setRequired(true),
		)
		.setDMPermission(false),
	async autocomplete(interaction) {
		const focused = interaction.options.getFocused();
		const choices = [
			{ name: "🤣 Meme", value: "🤣 Meme" },
			{ name: "🎤 Artist", value: "🎤 Artist" },
			{ name: "👀 Character", value: "👀 Character" },
			{ name: "🎷 Instrument", value: "🎷 Instrument" },
			{ name: "🪁 Anime", value: "🪁 Anime" },
			{ name: "🛡️ TITAN-Medium", value: "🛡️ TITAN-Medium" },
			{ name: "🔝 High-Quality", value: "🔝 High-Quality" },
			{ name: "📑 TTS", value: "📑 TTS" },
			{ name: "⚡ w-okada", value: "⚡ w-okada" },
		];

		const tags = interaction.options.getString('tags')?.split(',').map(t => t.trim()).filter(t => t !== "");
		let suggestions = [];
		let remaining = [...choices];
		const focusedTags = focused.split(',').map(t => t.trim());

		const normEmoji = (text) => text.replace(/[\uFE0F\uFE0E]/g, '');
		const isSelected = focusedTags.some(t => tags.includes(t));

		if (isSelected) {
			remaining = remaining.filter(c => !focusedTags.includes(c.value));
		} else {
			remaining = remaining.filter(c => 
				focusedTags.some(t => c.name.toLowerCase().includes(t.toLowerCase())) && 
				!tags.includes(c.value) && 
				!focusedTags.includes(c.value)
			);
		}

		if (tags.length > 0) {
			suggestions.push({ name: '...', value: '...' });
			suggestions = suggestions.concat(remaining.map(c => {
				const alreadySelected = tags.some(t => normEmoji(t).toLowerCase() === normEmoji(c.value).toLowerCase());
				if (!alreadySelected) {
					return { name: `${tags.join(', ')}${tags.length > 0 ? ', ' : ''}${c.name}`, value: `${tags.join(', ')}${tags.length > 0 ? ', ' : ''}${c.name}` };
				}
				return null;
			}).filter(c => c !== null));
		} else {
			suggestions = remaining.map(c => ({ name: c.name, value: c.value }));
		}

		const uniqueSuggestions = [];
		const seen = new Set();

		suggestions.forEach(s => {
			if (!seen.has(normEmoji(s.value))) {
				seen.add(normEmoji(s.value));
				uniqueSuggestions.push(s);
			}
		});

		const filtered = uniqueSuggestions.filter(s => {
			const words = s.name.split(',').map(w => w.trim());
			const uniqueWords = new Set(words);
			return uniqueWords.size === words.length; 
		});

		try {
			await interaction.respond(filtered);
		} catch(e) {}
	},
	async execute(interaction) {
		if (interaction.channel.parentId !== process.env.AI_HISPANO_MODEL_TICKET_CATEGORY_ID)
			return await interaction.reply({
				content: "This channel is not allowed for this action.",
				ephemeral: true,
			});

		const algorithm = interaction.options.getString("algorithm");
		const language = interaction.options.getString("language");
		const tags = normalizeEmojis(interaction.options.getString("tags")?.split(',').map(t => t.trim()) || []);
		const epochs = interaction.options.getString("epochs");
		const name = interaction.options.getString("name");
		const link = interaction.options.getString("link");
		const image = interaction.options.get("image");
		const imageURL =
			image?.attachment?.url ||
			"https://upload.wikimedia.org/wikipedia/commons/7/75/No_image_available.png";
		const audio = interaction.options.get("audio");
		const audioURL = audio?.attachment?.url;

		const userId = interaction.user.id;
		const username = interaction.user.username;

		const viewAudioButton = new ButtonBuilder()
			.setLabel("🎵 View Audio")
			.setStyle(ButtonStyle.Link)
			.setURL(
				`https://audio-player-qtacpmvp5-deiants-projects.vercel.app/?link=${audioURL}`,
			);

		const editPostButton = new ButtonBuilder()
			.setLabel("🔨 Edit Post")
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`epost_${userId}`);

		const uploadButton = new ButtonBuilder()
			.setLabel("⬆️ Upload Model")
			.setStyle(ButtonStyle.Primary)
			.setCustomId("mupload");

		const row = new ActionRowBuilder().addComponents(
			viewAudioButton,
			editPostButton,
			uploadButton,
		);

		const embed = new EmbedBuilder()
			.setTitle(`New model by ${username}`)
			.addFields(
				{ name: "Title", value: name, inline: true },
				{ name: "Epochs", value: epochs, inline: true },
				{ name: "Algorithm", value: algorithm, inline: true },
				{ name: "Link", value: link, inline: true },
			)
			.setDescription(
				`### Model Information\n\`\`\`${name} (RVC [${algorithm}] - ${epochs} Epochs)\n${link}\n\nModel created by <@${userId}>\`\`\`\n> **Tags:** ${language}, ${tags}`,
			)
			.setImage(imageURL)
			.setColor("White")
			.setFooter({ text: "Thank you for submitting your model!" })
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
