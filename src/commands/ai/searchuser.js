const {
	EmbedBuilder,
	SlashCommandBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_TOKEN,
);

// Function to create an embed for a model
function createModelEmbed(model, user) {
	const createdDate = model.created_at
		? `<t:${Math.trunc(new Date(model.created_at).getTime() / 1000)}:d>`
		: "Unknown";
	return new EmbedBuilder()
		.setTitle(model.name)
		.setURL(`https://applio.org/models?id=${model.id}`)
		.setAuthor({
			name: model.author_username,
			url: `https://applio.org/@${model.author_username}`,
		})
		.setDescription(
			`- **Uploaded:** ${createdDate}\n` +
				`- **Server:** ${model.server_name}\n` +
				`- **Likes:** ${model.likes}`,
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

// Function to create action buttons for a model
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
		.setLabel("👍 Like")
		.setStyle(ButtonStyle.Link)
		.setURL(`https://applio.org/models?id=${model.id}`);

	const botInviteButton = new ButtonBuilder()
		.setLabel("🤖 Bot Invite")
		.setStyle(ButtonStyle.Link)
		.setURL(
			`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
		);

	return new ActionRowBuilder().addComponents(
		saveButton,
		downloadButton,
		likeButton,
		botInviteButton,
	);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("searchuser")
		.setNameLocalizations({
			"es-ES": "buscador-usuario",
		})
		.setDescription("RVC » Search models uploaded by a user.")
		.setDescriptionLocalizations({
			"es-ES": "RVC » Busca modelos subidos por un usuario.",
		})
		.addStringOption((option) =>
			option
				.setName("user")
				.setAutocomplete(true)
				.setNameLocalizations({
					"es-ES": "usuario",
				})
				.setDescription(
					"Enter the username of the user you want to search for.",
				)
				.setDescriptionLocalizations({
					"es-ES":
						"Introduce el nombre de usuario del usuario que quieres buscar.",
				})
				.setRequired(true),
		)
		.setDMPermission(false),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		try {
			if (focusedValue.length < 3) {
				return;
			}
			const { data, error } = await supabase
				.from("models")
				.select("author_username")
				.ilike("author_username", `${focusedValue}%`);

			if (error) {
				console.error("Error fetching usernames from Supabase:", error);
				return;
			}

			const usernames = new Set(data.map((user) => user.author_username));
			const choices = Array.from(usernames).slice(0, 25);
			await interaction.respond(
				choices.map((choice) => ({ name: choice, value: choice })),
			);
		} catch (error) {
			console.error("Error in autocomplete:", error);
		}
	},
	async execute(interaction) {
		const user = interaction.options.getString("user");
		const messageIdMap = {};
		const loading = await interaction.deferReply();
		const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/user=${user}`;

		try {
			const response = await axios.get(url);
			const data = response.data.slice(0, 25);

			if (data.length === 0) {
				throw new Error("No models found for this user");
			}

			const options = data.map((result, index) => ({
				label: `${result.name}`,
				value: `V_D-${index}-${result.id}`,
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

			const newId = await loading.edit({
				content: `${interaction.user}, I have found ${data.length} results that match your search!`,
				components: [
					rowButtons,
					new ActionRowBuilder().addComponents(selectMenu),
				],
				embeds: [initialEmbed],
			});

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
					!/V_D-(\d+)/.test(interaction.values[0]) ||
					interaction.values.length === 0
				) {
					return;
				}

				menuCollector.resetTimer();
				const selectedModelIndex = Number.parseInt(
					interaction.values[0].replace(/V_D-/, "").split("-")[0],
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
						.setDescription(`Sorry, but I could not find models from "${user}"`)
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
