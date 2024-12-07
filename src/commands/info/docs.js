const {
	SlashCommandBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	ActionRowBuilder,
	SelectMenuBuilder,
	ComponentType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("docs")
		.setDescription("📜 Explore the Applio Documentation!"),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle(`Welcome to the Applio Documentation`)
			.setColor("White")
			.setDescription(
				"Navigate through our comprehensive guides to learn everything about Applio.\n\n" +
					"Select a category below to get started:\n" +
					"➤ Beginner's Guide\n" +
					"➤ Getting Started\n" +
					"➤ Advanced Guides\n" +
					"➤ Find Voice Models",
			)
			.setImage("https://applio.org/opengraph-image.png")
			.setTimestamp()
			.setFooter({
				text: `©️ Applio`,
				iconURL:
					"https://cdn.discordapp.com/avatars/1144714449563955302/92084831e7d14199a64a8b99bef95b73.webp?size=1024&format=webp&width=0&height=320",
			});

		const beginnersGuide = new EmbedBuilder()
			.setTitle("Beginner's Guide")
			.setColor("White")
			.setDescription(
				"🌱 New to Applio? Start here!\n\n" +
					"This section covers the fundamentals to get you familiar with Applio:\n\n" +
					"• [Frequent Doubts](https://docs.applio.org/beginners/frequent-doubts)\n" +
					"• [Interface Overview](https://docs.applio.org/beginners/interface)\n" +
					"• [Creating Your First Model](https://docs.applio.org/beginners/first-model)\n" +
					"• [Generating AI Covers](https://docs.applio.org/beginners/ai-cover)",
			)
			.setTimestamp()
			.setFooter({
				text: `©️ Applio`,
				iconURL:
					"https://cdn.discordapp.com/avatars/1144714449563955302/92084831e7d14199a64a8b99bef95b73.webp?size=1024&format=webp&width=0&height=320",
			});

		const gettingStarted = new EmbedBuilder()
			.setTitle("Getting Started")
			.setColor("White")
			.setDescription(
				"🚀 Ready to launch into Applio?\n\n" +
					"This section provides step-by-step instructions to get you up and running:\n\n" +
					"• [Installation](https://docs.applio.org/getting-started/installation)\n" +
					"• [Download Models](https://docs.applio.org/getting-started/download-models)\n" +
					"• [Training Your Models](https://docs.applio.org/getting-started/training)\n" +
					"• [Text-to-Speech (TTS)](https://docs.applio.org/getting-started/tts)\n" +
					"• [Using Pretrained Models](https://docs.applio.org/getting-started/pretrained)\n" +
					"• [Working with Embedder](https://docs.applio.org/getting-started/embedder)\n" +
					"• [Using Tensorboard](https://docs.applio.org/getting-started/tensorboard)\n" +
					"• [Audio Analizer](https://docs.applio.org/getting-started/audio-analizer)\n" +
					"• [Voice Blender](https://docs.applio.org/getting-started/voice-blender)\n" +
					"• [Plugins](https://docs.applio.org/getting-started/plugins)\n" +
					"• [Extra Features](https://docs.applio.org/getting-started/extra)\n" +
					"• [Other Alternatives](https://docs.applio.org/getting-started/other-alternatives)",
			)
			.setTimestamp()
			.setFooter({
				text: `©️ Applio`,
				iconURL:
					"https://cdn.discordapp.com/avatars/1144714449563955302/92084831e7d14199a64a8b99bef95b73.webp?size=1024&format=webp&width=0&height=320",
			});

		const guides = new EmbedBuilder()
			.setTitle("Advanced Guides")
			.setColor("White")
			.setDescription(
				"📖 Dive deeper into Applio's functionalities.\n\n" +
					"This section provides detailed guides for more advanced users:\n\n" +
					"• [Audio Isolating](https://docs.applio.org/guides/audio-isolating/)\n" +
					"• [Create Datasets](https://docs.applio.org/guides/create-datasets/)\n" +
					"• [Other Advanced Topics](https://docs.applio.org/guides/others)",
			)
			.setTimestamp()
			.setFooter({
				text: `©️ Applio`,
				iconURL:
					"https://cdn.discordapp.com/avatars/1144714449563955302/92084831e7d14199a64a8b99bef95b73.webp?size=1024&format=webp&width=0&height=320",
			});

		const findVoiceModels = new EmbedBuilder()
			.setTitle("Find Voice Models")
			.setColor("White")
			.setDescription(
				"🎤 Explore a vast library of voice models!\n\n" +
					"Find the perfect voice for your project:\n\n" +
					"• [Browse Voice Models (Bot)](https://docs.applio.org/find-voice-models/bot)\n" +
					"• [Browse Voice Models (Web)](https://docs.applio.org/find-voice-models/web)",
			)
			.setTimestamp()
			.setFooter({
				text: `©️ Applio`,
				iconURL:
					"https://cdn.discordapp.com/avatars/1144714449563955302/92084831e7d14199a64a8b99bef95b73.webp?size=1024&format=webp&width=0&height=320",
			});

		const components = (state) => [
			new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("docs-menu")
					.setPlaceholder("Select a Category")
					.setDisabled(state)
					.addOptions([
						{
							label: `Beginner's Guide`,
							value: `beginnersGuide`,
							description: `Learn the basics of Applio.`,
							emoji: "🌱",
						},
						{
							label: `Getting Started`,
							value: `gettingStarted`,
							description: `Set up and start using Applio.`,
							emoji: "🚀",
						},
						{
							label: `Advanced Guides`,
							value: `guides`,
							description: `Explore in-depth guides and tutorials.`,
							emoji: "📖",
						},
						{
							label: `Find Voice Models`,
							value: `findVoiceModels`,
							description: `Discover and browse voice models.`,
							emoji: "🎤",
						},
					]),
			),
		];

		const initialMessage = await interaction.reply({
			embeds: [embed],
			components: components(false),
		});

		const filter = (interaction) =>
			interaction.user.id === interaction.member.id;

		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			componentType: ComponentType.SelectMenu,
			idle: 300000,
			dispose: true,
		});

		collector.on("collect", (interaction) => {
			if (interaction.values[0] === "beginnersGuide") {
				interaction
					.update({ embeds: [beginnersGuide], components: components(false) })
					.catch((e) => {});
			} else if (interaction.values[0] === "gettingStarted") {
				interaction
					.update({ embeds: [gettingStarted], components: components(false) })
					.catch((e) => {});
			} else if (interaction.values[0] === "guides") {
				interaction
					.update({ embeds: [guides], components: components(false) })
					.catch((e) => {});
			} else if (interaction.values[0] === "findVoiceModels") {
				interaction
					.update({ embeds: [findVoiceModels], components: components(false) })
					.catch((e) => {});
			}
		});

		collector.on("end", (collected, reason) => {
			if (reason == "time") {
				initialMessage.edit({
					content: "Collector Destroyed, Try Again!",
					components: [],
				});
			}
		});
	},
};
