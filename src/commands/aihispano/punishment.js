const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("punishment")
		.setNameLocalizations({
			"es-ES": "sanción",
		})
		.setDescription(
			"AI Hispano » Apply a sanction to a user (Moderators only).",
		)
		.setDescriptionLocalizations({
			"es-ES":
				"AI Hispano » Aplicar una sanción a un usuario (Sólo moderadores).",
		})
		.addUserOption((option) =>
			option
				.setName("user")
				.setNameLocalizations({
					"es-ES": "usuario",
				})
				.setDescription("The user to be penalized.")
				.setDescriptionLocalizations({
					"es-ES": "El usuario a sancionar.",
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setNameLocalizations({
					"es-ES": "razón",
				})
				.addChoices(
					{ name: "Bot Spam", value: "Bot Spam" },
					{ name: "Chat Spamming", value: "Chat Spamming" },
					{ name: "WallText", value: "Walltext" },
					{ name: "Misbehavior", value: "Misbehavior" },
				)
				.setDescription("Reason for the sanction.")
				.setDescriptionLocalizations({
					"es-ES": "Razón de la sanción.",
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("time")
				.setNameLocalizations({
					"es-ES": "tiempo",
				})
				.addChoices(
					{ name: "1 minute", value: "1 minute" },
					{ name: "5 minutes", value: "5 minutes" },
					{ name: "10 minutes", value: "10 minutes" },
					{ name: "1 hour", value: "1 hour" },
					{ name: "1 day", value: "1 day" },
					{ name: "1 week", value: "1 week" },
				)
				.setDescription("Time to sanction the user.")
				.setDescriptionLocalizations({
					"es-ES": "Tiempo de sanción del usuario.",
				})
				.setRequired(true),
		)
		.addAttachmentOption((option) =>
			option
				.setName("proof")
				.setNameLocalizations({
					"es-ES": "prueba",
				})
				.setDescription("Proof of sanction.")
				.setDescriptionLocalizations({
					"es-ES": "Prueba de la sanción.",
				})
				.setRequired(false),
		)
		.setDMPermission(false),
	async execute(interaction) {
		const user = interaction.options.getMember("user");
		const reason = interaction.options.getString("reason");
		const time = interaction.options.getString("time");
		const proof = interaction.options.get("proof");
		const channel = interaction.guild.channels.cache.get(
			process.env.AI_HISPANO_PUNISHMENT_CHANNEL_ID,
		);

		const proofImg = proof?.attachment?.url ? proof.attachment.url : null;

		const member = interaction.member;
		if (
			member.roles.cache.some(
				(role) => role.id === process.env.AI_HISPANO_MOD_ROLE_ID,
			)
		) {
			const embedPunishment = new EmbedBuilder()
				.setTitle("New punishment")
				.addFields(
					{ name: "User", value: `${user}`, inline: true },
					{
						name: "Staff",
						value: `${interaction.member?.user}`,
						inline: true,
					},
					{ name: "Reason", value: `${reason}`, inline: true },
					{ name: "Time", value: `${time}`, inline: true },
				)
				.setImage(proofImg)
				.setColor("White")
				.setTimestamp();

			let timeoutMilliseconds = 0;

			switch (time) {
				case "1 minute":
					timeoutMilliseconds = 1 * 60 * 1000;
					break;
				case "5 minutes":
					timeoutMilliseconds = 5 * 60 * 1000;
					break;
				case "10 minutes":
					timeoutMilliseconds = 10 * 60 * 1000;
					break;
				case "1 hour":
					timeoutMilliseconds = 1 * 60 * 60 * 1000;
					break;
				case "1 day":
					timeoutMilliseconds = 24 * 60 * 60 * 1000;
					break;
				case "1 week":
					timeoutMilliseconds = 7 * 24 * 60 * 60 * 1000;
					break;
			}

			await user.timeout(timeoutMilliseconds, reason);

			channel.send({ embeds: [embedPunishment] });

			const embed = new EmbedBuilder()
				.setDescription(`Punishment awarded to user ${user} for ${time}.`)
				.setColor("White")
				.setTimestamp();

			return interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else {
			return interaction.reply(
				"You don't have permission to use this command.",
			);
		}
	},
};
