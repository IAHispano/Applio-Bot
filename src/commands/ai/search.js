const {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_TOKEN,
);

const LANG_TAGS = {
	ES: "Spanish",
	EN: "English",
	JP: "Japanese",
	KR: "Korean",
	PT: "Portuguese",
	FR: "French",
	TR: "Turkish",
	RU: "Russian",
	IT: "Italian",
	PL: "Polish",
	OTHER: "Other",
};

function getLanguageTag(text) {
	const parts = text.split(",");
	for (const part of parts) {
		const trim = part.trim();
		if (LANG_TAGS.hasOwnProperty(trim)) {
			return LANG_TAGS[trim];
		}
	}
	return "Unknown";
}

function createModelEmbed(model, user) {
	const createdDate = model.created_at
		? `<t:${Math.trunc(new Date(model.created_at).getTime() / 1000)}:d>`
		: "Unknown";
	return new EmbedBuilder()
		.setTitle(model.name)
		.setURL(`https://applio.org/models?id=${model.id}`)
		.setAuthor({
			name: model.author_username,
			url:
				model.author_username && !model.author_username.includes(" ")
					? `https://applio.org/@${model.author_username}`
					: undefined,
		})
		.setDescription(
			`- **Uploaded:** ${createdDate}\n` +
				`- **Server:** ${model.server_name}\n` +
				`- **Likes:** ${model.likes}\n` +
				`- **Lang:** ${getLanguageTag(model.tags)}`,
		)
		.setColor("White")
		.setThumbnail(model.image_url !== "N/A" ? model.image_url : null)
		.addFields(
			{
				name: "Epochs",
				value: model.epochs || "Unknown",
				inline: true,
			},
			{ name: "Technology", value: model.type, inline: true },
			{ name: "Algorithm", value: model.algorithm, inline: true },
		)
		.setFooter({
			text: `Requested by ${user.tag}`,
			iconURL: user.displayAvatarURL({ dynamic: true }),
		})
		.setTimestamp();
}

function createModelButtons(model) {
	const saveButton = new ButtonBuilder()
		.setLabel("💾 Save")
		.setStyle(ButtonStyle.Primary)
		.setCustomId(`save_button_${model.id}`);

	const downloadButton = new ButtonBuilder()
		.setLabel("📤 Download")
		.setStyle(ButtonStyle.Link)
		.setURL(`https://applio.org/models/download/${model.id}`);

	const likeButton = new ButtonBuilder()
		.setLabel("👍 Rate")
		.setStyle(ButtonStyle.Link)
		.setURL(`https://applio.org/models?id=${model.id}`);

	const reportButton = new ButtonBuilder()
		.setLabel("🚩 Report")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId(`mreport_${model.id}`);

	return new ActionRowBuilder().addComponents(
		saveButton,
		downloadButton,
		reportButton,
		likeButton,
	);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("search")
		.setNameLocalizations({
			"es-ES": "buscador",
		})
		.setDescription("RVC » Search any voice model in a huge database.")
		.setDescriptionLocalizations({
			"es-ES":
				"RVC » Busca cualquier modelo de voz en una enorme base de datos.",
		})
		.addStringOption((option) =>
			option
				.setName("model")
				.setAutocomplete(true)
				.setNameLocalizations({
					"es-ES": "modelo",
				})
				.setDescription("Enter the name of the model you wish to search for.")
				.setDescriptionLocalizations({
					"es-ES": "Ingrese el nombre del modelo que desea buscar.",
				})
				.setRequired(true),
		)
		.setDMPermission(false),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		try {
			const { data, error } = await supabase.from("models").select("*").filter("name", "ilike", `%${focusedValue}%`).limit(25);
			if (error) {
				console.error("Error fetching models:", error);
				return;
			} 
			const rdata = data;
			const mapped = new Set(rdata.map((result) => result.name));
			const choices = Array.from(mapped).slice(0, 25);
			await interaction.respond(
				choices.map((choice) => ({ name: choice, value: choice })),
			);
		} catch (error) {
			console.error("Error in autocomplete:", error);
		}
	},
	async execute(interaction) {
		const modelName = interaction.options.getString("model");

		const messageIdMap = {};

		if (modelName.length < 3) {
			return interaction.reply({
				content: "The model name must be at least 3 characters long.",
			});
		}

		const loading = await interaction.deferReply();
		try {
			const { data, error } = await supabase.from("models").select("*").filter("name", "ilike", `%${modelName}%`).limit(25);
			if (error) {
				console.error("Error fetching model:", error);
				return;
			}

			if (data.length === 0) {
				throw new Error("No models found");
			}

			const options = data.map((result, index) => ({
				label: `${result.name}`,
				value: `${index}-${result.id}-${Math.trunc(
					new Date(result.created_at).getTime() / 1000,
				)}`,
				description: `${result.type} · Made by ${result.author_username}`,
				emoji: "<:dot:1134526388456669234>",
			}));

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId(interaction.user.id)
				.setPlaceholder(`👀 Select a result, found ${data.length} results...`)
				.setOptions(options);

			const firstResult = data[0];
			const initialEmbed = createModelEmbed(firstResult, interaction.user);
			const rowButtons = createModelButtons(firstResult);

			let newId = await loading.edit({
				content: `${interaction.user}, I have found ${data.length} results that match your search!`,
				components: [
					rowButtons,
					new ActionRowBuilder().addComponents(selectMenu),
				],
				embeds: [initialEmbed],
			});

			newId = await newId;

			messageIdMap[firstResult.id] = newId.id;

			const menuCollector = interaction.channel.createMessageComponentCollector(
				{
					componentType: ComponentType.SELECT_MENU,
					filter: (i) => i.user.id === interaction.user.id,
					time: 60000,
				},
			);

			menuCollector.on("collect", async (interaction) => {
				if (
					!interaction.values ||
					/V_D-(\d+)/.test(interaction.values[0]) ||
					interaction.values.length === 0
				) {
					return;
				}
				menuCollector.resetTimer();
				const selectedModelIndex = Number.parseInt(
					interaction.values[0].split("-")[0],
				);
				const selectedModel = data[selectedModelIndex];
				if (!selectedModel) {
					return;
				}

				const embed = createModelEmbed(selectedModel, interaction.user);
				const rowButtons = createModelButtons(selectedModel);

				try {
					await interaction.update({
						embeds: [embed],
						components: [
							rowButtons,
							new ActionRowBuilder().addComponents(selectMenu),
						],
					});
					messageIdMap[selectedModel.id] = interaction.message.id;
				} catch (error) {
					console.error("Error updating message:", error);
				}
			});

			const buttonCollector =
				interaction.channel.createMessageComponentCollector({
					componentType: ComponentType.Button,
					time: 60000,
				});

			buttonCollector.on("collect", async (interaction) => {
				if (interaction.customId.startsWith("save_button_")) {
					const embedId = interaction.customId.replace("save_button_", "");
					const originalMessageId = messageIdMap[embedId];

					if (originalMessageId) {
						try {
							const originalMessage =
								await interaction.channel.messages.fetch(originalMessageId);

							if (originalMessage && originalMessage.embeds.length > 0) {
								buttonCollector.resetTimer();
								const savedEmbed = originalMessage.embeds[0];
								const savedComponents = originalMessage.components;

								await interaction.user
									.send({
										embeds: [savedEmbed],
										components: savedComponents,
									})
									.then(async () => {
										await interaction.reply({
											content: `💾 ${interaction.user}, sent you a DM with the model information!`,
											ephemeral: true,
										});
									})
									.catch(async () => {
										await interaction.reply({
											content: `❌ ${interaction.user}, I couldn't send you a DM, make sure you have them enabled.`,
											ephemeral: true,
										});
									});
								delete messageIdMap[embedId];
							}
						} catch (error) {
							console.error("Error fetching/sending message:", error);
						}
					}
				}
			});
		} catch (error) {
			await loading.edit({
				embeds: [
					new EmbedBuilder()
						.setTitle("Oops...")
						.setDescription(
							`Sorry, but I could not find models that match your search "${modelName}"`,
						)
						.setColor("White"),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel("🤖 Bot Invite")
							.setStyle(ButtonStyle.Link)
							.setURL(
								`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
							),
						new ButtonBuilder()
							.setLabel("🔍 Search")
							.setStyle(ButtonStyle.Link)
							.setURL("https://applio.org/models"),
					),
				],
			});
		}
	},
};