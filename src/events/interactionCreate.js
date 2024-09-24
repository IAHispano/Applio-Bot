const {
	Events,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	AttachmentBuilder,
} = require("discord.js");

const client = require("../bot.js");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_TOKEN,
);
const fetch = require("node-fetch");
const headers = {
	Authorization: `Bot ${process.env.BOT_TOKEN}`,
	"Content-Type": "application/json",
};

const INTERACTION_CALLBACK_TYPE_MODAL = 9;
const Word = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const removeEmojis = (str) =>
	str.replace(
		/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u0023-\u0039]\uFE0F?\u20E3|[\u2194-\u21AA]|[\u2B05-\u2B07]|[\u2934-\u2935]|[\u3030]|[\u3297\u3299]|[\u203C-\u2049]|[\u25AA-\u25FE]|[\u2600-\u26FF]|\uD83D[\uDE00-\uDE4F]|\uD83D[\uDC00-\uDDFF]|\uD83C[\uDF00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
		"",
	);
const tagMap = {
	English: "1287068828567867392",
	Spanish: "1287068907030708268",
	"Latin America": "1287068982716928071",
	"Other languages": "1287069017911201792",
	Instrument: "1287069152216879186",
	"High-Quality": "1287069253630955641",
	Meme: "1287069047514595459",
	Character: "1287069114896220244",
	Artist: "1287069073926131792",
	Anime: "1287069202510774447",
	TTS: "1287069284723589213",
	Realtime: "1287069337773015132",
};
async function createInteractionResponse(interaction, body) {
	try {
		const res = await fetch(
			`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
			{
				method: "POST",
				headers,
				body,
			},
		);

		return res;
	} catch (error) {
		console.error("Error sending modal:", error);
	}
}
module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction) {
		if (interaction.channel && interaction.channel.id === "1159514067187277865")
			return;
		if (interaction.type === 3) {
			ButtonInt(interaction);
			return;
		}
		if (interaction.isModalSubmit()) {
			Modal(interaction);
			return;
		}
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

		try {
			const noperms = await handlePermissions(command, interaction);
			if (noperms) return;
			await executeCommand(command, interaction);
		} catch (error) {
			await handleCommandError(error, interaction, channel);
		}
	},
};
function VerifyUser(m) {
	const w = 604800000; // 7 días en milisegundos
	const n = Date.now();
	const j = m.joinedAt.getTime();
	return n - j >= w;
}

async function Modal(interaction) {
	const $id = interaction.customId;
	if ($id.startsWith("mpost")) {
		const embed = interaction.message.embeds[0];
		if (!embed || !embed.fields) {
			return interaction.reply({
				content: "No embed fields found",
				ephemeral: true,
			});
		}
		const newValues = {
			Title: interaction.fields.getTextInputValue("Title"),
			Epochs: interaction.fields.getTextInputValue("Epochs"),
			Algorithm: interaction.fields.getTextInputValue("Algorithm"),
			Link: interaction.fields.getTextInputValue("Link"),
		};

		const tagsIndex = embed.description.indexOf("\n> **Tags:**");
		const descriptionBeforeTags =
			tagsIndex !== -1
				? embed.description.substring(0, tagsIndex).split("\n```")[0]
				: "### Model Information\n";
		const tagsPart =
			tagsIndex !== -1 ? embed.description.substring(tagsIndex) : "";
		embed.data.description = `${descriptionBeforeTags}\n\`\`\`${newValues.Title} (RVC [${newValues.Algorithm}] - ${newValues.Epochs} Epochs)\n${newValues.Link}\n\nModel created by <@${interaction.user.id}>\`\`\`${tagsPart}`;
		embed.fields.forEach((field) => {
			switch (field.name) {
				case "Title":
					field.value = newValues.Title || field.value;
					break;
				case "Epochs":
					field.value = newValues.Epochs || field.value;
					break;
				case "Algorithm":
					field.value = newValues.Algorithm || field.value;
					break;
				case "Link":
					field.value = newValues.Link || field.value;
					break;
				default:
					break;
			}
		});
		await interaction.update({ embeds: [embed] });
		await interaction.followUp({ content: "Post Updated" });
	} else if ($id.startsWith("sreport")) {
		const [_, model] = $id.split("_");
		const ebd = interaction.message.embeds[0];
		let title = "Unknown";
		if (ebd && ebd.data.title) {
			title = ebd.data.title;
		}
		const embed = new EmbedBuilder()
			.setTitle("New report for " + model)
			.addFields(
				{ name: "**Model**", value: `${title}`, inline: true },
				{
					name: "**Reason**",
					value: `${interaction.fields.getTextInputValue("Reason")}`,
					inline: true,
				},
			)
			.setDescription(`Model reported by ${interaction.user}`)
			.setColor("White")
			.setTimestamp();
		const deleteModel = new ButtonBuilder()
			.setLabel("🗑️ Delete")
			.setStyle(ButtonStyle.Primary)
			.setCustomId(`mdelete_${model}`);

		const linkModel = new ButtonBuilder()
			.setLabel("📤 Model")
			.setStyle(ButtonStyle.Link)
			.setURL(`https://applio.org/models?id=${model}`);
		const rowButtons = new ActionRowBuilder().addComponents(
			deleteModel,
			linkModel,
		);
		let content = { embeds: [embed], components: [rowButtons] };
		await client.shard.broadcastEval(
			(c, context) => {
				const [content] = context;
				try {
					const channel = c.channels.cache.get(
						process.env.AI_HISPANO_REPORT_MODEL_CHANNEL_ID,
					);
					if (channel) {
						channel.send(content);
					}
				} catch (error) {
					console.log(error);
				}
			},
			{
				context: [content],
			},
		);
		//const channel = interaction.guild.channels.cache.get("1135012781679181935");
		await interaction.deferUpdate();
		//await channel.send({ embeds: [embed], components: [rowButtons] })
	}
}

async function ButtonInt(interaction) {
	const $id = interaction.customId;
	if ($id.startsWith("epost_")) {
		const [_, user] = $id.split("_");
		if (interaction.user.id !== user)
			return interaction.reply({
				content: "Only the one executing the command has permission to access",
			});
		const data = interaction.message.embeds[0];
		const modalCustomId = `mpost_${interaction.message.id}`;
		const modalBody = JSON.stringify({
			type: INTERACTION_CALLBACK_TYPE_MODAL,
			data: {
				title: "Edit Post",
				custom_id: modalCustomId,
				components: [
					{
						type: 1,
						components: [
							{
								type: 4,
								custom_id: `Title`,
								label: "Title",
								placeholder: data.fields[0].value,
								style: 2,
								min_length: 2,
								max_length: 1000,
								required: true,
							},
						],
					},
					{
						type: 1,
						components: [
							{
								type: 4,
								custom_id: `Epochs`,
								label: "Epochs",
								placeholder: data.fields[1].value || "Unknown",
								style: 2,
								min_length: 2,
								max_length: 1000,
								required: true,
							},
						],
					},
					{
						type: 1,
						components: [
							{
								type: 4,
								custom_id: `Algorithm`,
								label: "Algorithm",
								placeholder: data.fields[2].value,
								style: 2,
								min_length: 2,
								max_length: 1000,
								required: true,
							},
						],
					},
					{
						type: 1,
						components: [
							{
								type: 4,
								custom_id: "Link",
								label: "Link",
								placeholder: "Link",
								style: 2,
								min_length: 2,
								max_length: 2000,
								required: true,
							},
						],
					},
				],
			},
		});

		await createInteractionResponse(interaction, modalBody);
	} else if ($id.startsWith("mreport")) {
		const [_, model] = $id.split("_");
		const modal = `sreport_${model}`;
		const modalBody = JSON.stringify({
			type: INTERACTION_CALLBACK_TYPE_MODAL,
			data: {
				title: "Report Model",
				custom_id: modal,
				components: [
					{
						type: 1,
						components: [
							{
								type: 4,
								custom_id: `Reason`,
								label: "Reason",
								placeholder: "Mention the reason for the report",
								style: 2,
								min_length: 2,
								max_length: 1024,
								required: true,
							},
						],
					},
				],
			},
		});

		await createInteractionResponse(interaction, modalBody);
	} else if ($id.startsWith("mdelete")) {
		if (
			!interaction.member.roles.cache.has(process.env.AI_HISPANO_MOD_ROLE_ID)
		) {
			return await interaction.reply({
				content: "No Allowed",
				ephemeral: true,
			});
		}
		const [_, model] = $id.split("_");
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("confirm")
				.setLabel("Confirm")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId("cancel")
				.setLabel("Cancel")
				.setStyle(ButtonStyle.Danger),
		);

		const message = await interaction.reply({
			content: "Do you confirm this action?",
			components: [row],
			ephemeral: true,
		});

		const filter = (i) =>
			i.user.id === interaction.user.id &&
			i.member.roles.cache.has(process.env.AI_HISPANO_MOD_ROLE_ID);
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 15000,
		});

		collector.on("collect", async (i) => {
			if (i.customId === "confirm") {
				await i.update({ content: "Action confirmed!", components: [] });
				const rows = interaction.message.components.map((row) => {
					return new ActionRowBuilder().addComponents(
						row.components.map((button) => {
							const builder = ButtonBuilder.from(button);
							if (builder.data.custom_id === $id) {
								builder.setDisabled(true);
							}
							return builder;
						}),
					);
				});
				await interaction.message.edit({
					components: rows,
				});

				const { error } = await supabase
					.from("models")
					.delete()
					.eq("id", model);
				collector.stop();
			} else if (i.customId === "cancel") {
				await i.update({ content: "Action canceled!", components: [] });
				collector.stop();
			}
		});

		collector.on("end", (collected) => {
			if (collected.size === 0) {
				message.edit({
					content: "No response received in time!",
					components: [],
				});
			}
		});
	} else if ($id.startsWith("muploadedit")) {
		if (
			!interaction.member.roles.cache.has(process.env.AI_HISPANO_MOD_ROLE_ID)
		) {
			return await interaction.reply({
				content: "No Allowed",
				ephemeral: true,
			});
		}
		try {
			const threadId = interaction.message.content.match(/<#(\d+)>/)[1];
			const thread = interaction.client.channels.cache.get(threadId);
			if (!thread) throw new Error("Thread not found");
			const firstMessage = await thread.fetchStarterMessage();
			if (!firstMessage) return;
			const embed = interaction.message.embeds[0].data;
			const fields = embed.fields.reduce((acc, field) => {
				acc[field.name] = field.value;
				return acc;
			}, {});
			let clean = embed.description.replace("### Model Information\n```", "");
			clean = clean
				.substring(clean.indexOf("\n") + 1)
				.split("```\n>")[0]
				.trim();
			await firstMessage.edit({ content: clean });
			const tagsMatch = removeEmojis(embed.description).match(
				/> \*\*Tags:\*\* (.+)/,
			);
			const tagsString = tagsMatch ? tagsMatch[1] : "";
			const extractedTags = tagsString.split(", ").map((tag) => tag.trim());
			const appliedTags = extractedTags
				.map((tag) => {
					const lowerCaseTag = tag.toLowerCase();
					const matchingTag = Object.keys(tagMap).find((key) =>
						lowerCaseTag.includes(key.toLowerCase()),
					);
					const tagId = matchingTag ? tagMap[matchingTag] : undefined;
					return tagId;
				})
				.filter((tagId) => tagId !== undefined);
			await thread.setName(
				`${Word(fields.Title)} (RVC [${fields.Algorithm}] - ${
					fields.Epochs
				} Epochs)`,
			);
			await thread.setAppliedTags(appliedTags, "Tags applied");
			await interaction.update({
				content: `Thread: <#${thread.id}> | ${thread.name}`,
				components: interaction.message.components,
			});
			await interaction.followUp({
				content: `Model successfully edited in thread <#${thread.id}>.`,
			});
		} catch (error) {
			await interaction.update({
				content: "Error editing thread",
				components: interaction.message.components,
			});
		}
	} else if ($id.startsWith("mupload")) {
		if (
			!interaction.member.roles.cache.has(process.env.AI_HISPANO_MOD_ROLE_ID)
		) {
			return await interaction.reply({
				content: "No Allowed",
				ephemeral: true,
			});
		}
		try {
			const embed = interaction.message.embeds[0].data;
			const fields = embed.fields.reduce((acc, field) => {
				acc[field.name] = field.value;
				return acc;
			}, {});
			let clean = embed.description.replace("### Model Information\n```", "");
			clean = clean
				.substring(clean.indexOf("\n") + 1)
				.split("```\n>")[0]
				.trim();
			const imageUrl = embed.image.url;
			const response = await fetch(imageUrl);
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const file = new AttachmentBuilder(buffer).setName("image.webp");
			const threadChannel = interaction.client.channels.cache.get(
				process.env.AI_HISPANO_MODELS_CHANNEL_ID,
			);
			if (!threadChannel) {
				throw new Error("Thread channel not found");
			}
			const tagsMatch = removeEmojis(embed.description).match(
				/> \*\*Tags:\*\* (.+)/,
			);
			const tagsString = tagsMatch ? tagsMatch[1] : "";
			const extractedTags = tagsString.split(", ").map((tag) => tag.trim());
			const appliedTags = extractedTags
				.map((tag) => {
					const lowerCaseTag = tag.toLowerCase();
					const matchingTag = Object.keys(tagMap).find((key) =>
						lowerCaseTag.includes(key.toLowerCase()),
					);
					const tagId = matchingTag ? tagMap[matchingTag] : undefined;
					return tagId;
				})
				.filter((tagId) => tagId !== undefined);
			const thread = await threadChannel.threads.create({
				name: `${Word(fields.Title)} (RVC [${fields.Algorithm}] - ${
					fields.Epochs
				} Epochs)`,
				message: {
					content: clean,
					files: [file],
				},
			});
			await thread.setAppliedTags(appliedTags, "Tags applied");
			const rows = interaction.message.components.map((row) => {
				return new ActionRowBuilder().addComponents(
					row.components.map((button) => {
						const builder = ButtonBuilder.from(button);
						if (builder.data.custom_id === "mupload") {
							builder.setCustomId("muploadedit");
						}
						return builder;
					}),
				);
			});
			await interaction.update({
				content: `Thread: <#${thread.id}> | ${thread.name}`,
				components: rows,
			});
			await interaction.followUp({
				content: `Model successfully created in thread <#${thread.id}>.`,
			});
		} catch {
			await interaction.update({
				content: "Error upload thread",
				components: interaction.message.components,
			});
		}
	}
}

async function handlePermissions(command, interaction) {
	if (
		command.devOnly &&
		!process.env.OWNER_ID.split(",").includes(interaction.user.id)
	) {
		interaction.reply("This command is restricted to developers.");
		return true;
	}
}

async function executeCommand(command, interaction) {
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(
			`An error occurred while executing ${interaction.commandName}: ${error.stack}`,
		);
	}
}

async function handleCommandError(error, interaction, channel) {
	console.error(error);

	try {
		const error_embed = new EmbedBuilder()
			.setColor("White")
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

	await interaction.reply({
		content:
			"There was an error while executing this command. Please try again later.",
		ephemeral: true,
	});
}
