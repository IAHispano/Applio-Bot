const {
	EmbedBuilder,
	SlashCommandBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { fetchModels } = require("../../utils/civitai.js");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("civitai")
		.setNameLocalizations({
			"es-ES": "civitai",
		})
		.setDescription("civitai » Search any voice model in civitai.")
		.setDescriptionLocalizations({
			"es-ES": "civitai » Busca cualquier modelo de voz en civitai.",
		})
		.addStringOption((option) =>
			option
				.setName("page")
				.setNameLocalizations({
					"es-ES": "pagina",
				})
				.setDescription("The page from which to start fetching models.")
				.setDescriptionLocalizations({
					"es-ES": "La página desde la que empezar a obtener modelos.",
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("model")
				.setNameLocalizations({
					"es-ES": "modelo",
				})
				.setDescription("Enter the name of the model you wish to search for.")
				.setDescriptionLocalizations({
					"es-ES": "Ingrese el nombre del modelo que desea buscar.",
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("sort")
				.setNameLocalizations({
					"es-ES": "orden",
				})
				.setDescription("The order in which you wish to sort the results.")
				.setDescriptionLocalizations({
					"es-ES": "El orden en que desea ordenar los resultados.",
				})
				.setRequired(true)
				.addChoices(
					{ name: "Highest Rated", value: "Highest Rated" },
					{ name: "Most Downloaded", value: "Most Downloaded" },
					{ name: "Newest", value: "Newest" },
				),
		)
		.addStringOption((option) =>
			option
				.setName("period")
				.setNameLocalizations({
					"es-ES": "tiempo",
				})
				.setDescription("The time frame in which the models will be sorted.")
				.setDescriptionLocalizations({
					"es-ES": "El tiempo en el que se clasificarán los modelos.",
				})
				.setRequired(true)
				.addChoices(
					{ name: "AllTime", value: "AllTime" },
					{ name: "Year", value: "Year" },
					{ name: "Month", value: "Month" },
					{ name: "Week", value: "Week" },
					{ name: "Day", value: "Day" },
				),
		)
		.setDMPermission(false),

	async execute(interaction) {
		const page = interaction.options.getString("page");
		const model = interaction.options.getString("model");
		const sort = interaction.options.getString("sort");
		const period = interaction.options.getString("period");
		if (model.length <= 2) {
			const embed = new EmbedBuilder()
				.setDescription("Please enter a model name with at least 2 characters.")
				.setColor("White");
			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const loadingMessage = await interaction.deferReply();

		try {
			const response = await fetchModels({
				limit: 100,
				page: page,
				query: model,
				sort: sort,
				period: period,
			});
			let data = response.items;

			data = data.filter((modelo) =>
				modelo.name.toLowerCase().includes(model.toLowerCase()),
			);
			let messageIdMap = {};

			const options = data.slice(0, 25).map((result, index) => ({
				label: `${result.name.slice(0, 100)}`,
				value: `${index}-${result.id}-${result.modelVersions[0].createdAt}`,
				description: `${result.type} · Made by ${result.creator.username}`,
				emoji: "<:dot:1134526388456669234>",
			}));

			const result = data[0]; // Get the first result

			const LinkButton = new ButtonBuilder()
				.setLabel("📤 Link")
				.setStyle(ButtonStyle.Link);

			const embed = new EmbedBuilder()
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
				})
				.setColor("White")
				.setTimestamp();

			const uploadedTimestamp =
				typeof result.modelVersions[0].createdAt === "string"
					? Date.parse(result.modelVersions[0].createdAt) / 1000
					: typeof result.modelVersions[0].createdAt === "number"
						? result.modelVersions[0].createdAt / 1000
						: NaN;
			const uploadedText = isNaN(uploadedTimestamp)
				? "N/A"
				: `<t:${Math.floor(uploadedTimestamp)}:R>`;

			embed.setTitle(result.name.slice(0, 100));

			embed.setDescription(
				`**Owner:** ${result.creator.username}\n**Uploaded:** ${uploadedText}`,
			);

			const fields = [
				{
					name: "Type",
					value: `${result.type}`,
					inline: true,
				},
			];

			embed.addFields(fields);

			if (
				result.modelVersions[0].images[0].nsfw !== "X" &&
				result.modelVersions[0].images[0].nsfw !== "Mature"
			) {
				embed.setThumbnail(result.modelVersions[0].images[0].url);
			} else {
				embed.setThumbnail(
					interaction.user.displayAvatarURL({ dynamic: true }),
				);
			}

			LinkButton.setURL(`https://civitai.com/models/${result.id}`);

			let embedId = `${result.id}`;

			const saveButton = new ButtonBuilder()
				.setLabel("💾 Save")
				.setStyle(ButtonStyle.Primary)
				.setCustomId(`save_fake_${result.id}`);

			const menu = new StringSelectMenuBuilder()
				.setCustomId(interaction.user.id)
				.setPlaceholder(`🔎 ${data.length} models found...`)
				.setOptions(options);

			if (data.length === 1) {
				menu.setDisabled(true);
			}

			const row_menu = new ActionRowBuilder().addComponents(menu);

			const row_buttons = new ActionRowBuilder().addComponents(
				saveButton,
				LinkButton,
			);
			let new_id = loadingMessage.edit({
				content: `I have found ${data.length} results for the search ${model}...`,
				embeds: [embed],
				components: [row_menu, row_buttons],
			});
			new_id = await new_id;
			messageIdMap[embedId] = new_id.id;

			let menuCollector = interaction.channel.createMessageComponentCollector({
				componentType: ComponentType.StringSelect,
				filter: (i) =>
					i.user.id === interaction.user.id &&
					i.customId === interaction.user.id,
			});

			menuCollector.on("collect", async (interaction) => {
				if (!interaction.values || interaction.values.length === 0) {
					return;
				}

				const selectedModelIndex = parseInt(
					interaction.values[0].split("-")[0],
				);

				const selectedResult = data[selectedModelIndex];

				if (selectedResult) {
					const LinkButton = new ButtonBuilder()
						.setLabel("📤 Link")
						.setStyle(ButtonStyle.Link);

					const embed = new EmbedBuilder()
						.setTitle(selectedResult.name.slice(0, 100))
						.setFooter({
							text: `Requested by ${interaction.user.tag}`,
							iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
						})
						.setColor("White")
						.setTimestamp();

					const uploadedTimestamp =
						typeof selectedResult.modelVersions[0].createdAt === "string"
							? Date.parse(selectedResult.modelVersions[0].createdAt) / 1000
							: typeof selectedResult.modelVersions[0].createdAt === "number"
								? selectedResult.modelVersions[0].createdAt / 1000
								: NaN;
					const uploadedText = isNaN(uploadedTimestamp)
						? "N/A"
						: `<t:${Math.floor(uploadedTimestamp)}:R>`;

					embed.setDescription(
						`**Owner:** ${selectedResult.creator.username}\n**Uploaded:** ${uploadedText}`,
					);

					const fields = [
						{
							name: "Type",
							value: `${selectedResult.type}`,
							inline: true,
						},
					];

					embed.addFields(fields);

					if (
						selectedResult.modelVersions[0].images[0].nsfw !== "X" &&
						selectedResult.modelVersions[0].images[0].nsfw !== "Mature"
					) {
						embed.setThumbnail(selectedResult.modelVersions[0].images[0].url);
					} else {
						embed.setThumbnail(
							interaction.user.displayAvatarURL({ dynamic: true }),
						);
					}

					LinkButton.setURL(`https://civitai.com/models/${selectedResult.id}`);

					let embedId = `${selectedResult.id}`;

					const saveButton = new ButtonBuilder()
						.setLabel("💾 Save")
						.setStyle(ButtonStyle.Primary)
						.setCustomId(`save_fake_${selectedResult.id}`);

					const row_buttons = new ActionRowBuilder().addComponents(
						saveButton,
						LinkButton,
					);

					const menu = new StringSelectMenuBuilder()
						.setCustomId(interaction.user.id)
						.setPlaceholder(`🔎 ${data.length} models found...`)
						.setOptions(options);

					const row_menu = new ActionRowBuilder().addComponents(menu);
					interaction.update({
						embeds: [embed],
						components: [row_menu, row_buttons],
					});

					messageIdMap[embedId] = interaction.message.id;
				}
			});

			let buttonCollector = interaction.channel.createMessageComponentCollector(
				{
					componentType: ComponentType.Button,
				},
			);

			buttonCollector.on("collect", async (interaction) => {
				if (interaction.customId.startsWith("save_fake_")) {
					const embedId = interaction.customId.replace("save_fake_", "");
					const originalMessageId = messageIdMap[embedId];

					if (originalMessageId) {
						const originalMessage =
							await interaction.channel.messages.fetch(originalMessageId);

						if (originalMessage && originalMessage.embeds.length > 0) {
							const savedEmbed = originalMessage.embeds[0];
							const savedComponents = originalMessage.components;

							interaction.user
								.send({
									embeds: [savedEmbed],
									components: savedComponents,
								})
								.then(() => {
									interaction.reply({
										content: `💾 ${interaction.user}, sent you a DM with the model information!`,
										ephemeral: true,
									});
								})
								.catch(() => {
									interaction.reply({
										content: `❌ ${interaction.user}, I couldn't send you a DM, make sure you have them enabled.`,
										ephemeral: true,
									});
								});
							delete messageIdMap[embedId];
						} else {
						}
					} else {
					}
				}
			});
			buttonCollector.on("end", async (collected, reason) => {
				for (const embedId in messageIdMap) {
					const originalMessageId = messageIdMap[embedId];
					if (originalMessageId) {
						try {
							const originalMessage =
								await interaction.channel.messages.fetch(originalMessageId);

							if (originalMessage && originalMessage.components.length > 0) {
								delete messageIdMap[embedId];
							}
						} catch (error) {
							console.log("");
						}
					}
				}
			});
		} catch (error) {
			console.log(error);
			const embed = new EmbedBuilder()
				.setDescription(`No results found for the search ${model}...`)
				.setColor("White")
				.setFooter({
					text: `Powered by Applio — Make sure you spelled it correctly!`,
				});
			await loadingMessage.edit({
				embeds: [embed],
				content: null,
			});
		}
	},
};
