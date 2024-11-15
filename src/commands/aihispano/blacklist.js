const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
	AddBlackList,
	IsInBlacklist,
	RemoveBlackList,
} = require("../../utils/blacklist");

module.exports = {
	devOnly: true,
	data: new SlashCommandBuilder()
		.setName("blacklist")
		.setDescription("Admin » Add a user to the blacklist.")
		.setDescriptionLocalizations({
			"es-ES": "Admin » Añadir un usuario la lista negra.",
		})
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName("user")
				.setNameLocalizations({ "es-ES": "usuario" })
				.setDescription("The user to add in the blacklist.")
				.setDescriptionLocalizations({
					"es-ES": "El usuario a añadir en la lista negra.",
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("method")
				.setNameLocalizations({ "es-ES": "método" })
				.setDescription("Add or Delete from the blacklist.")
				.setDescriptionLocalizations({
					"es-ES": "Agregar o eliminar de la lista negra.",
				})
				.setRequired(true)
				.addChoices(
					{ name: "Add", value: "Add" },
					{ name: "Delete", value: "Delete" },
				),
		)
		.addStringOption((option) =>
			option
				.setName("command")
				.setNameLocalizations({ "es-ES": "comando" })
				.setDescription("The command to blacklist.")
				.setDescriptionLocalizations({
					"es-ES": "El comando para añadir a la lista negra.",
				}),
		),

	async execute(interaction) {
		const user = interaction.options.getUser("user");
		const cmd = interaction.options.getString("command") || "";
		const method = interaction.options.getString("method");
		const userId = user.id;

		const isBlacklisted = IsInBlacklist(userId, cmd);

		if (method === "Add") {
			if (isBlacklisted) {
				return interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Already Blacklisted")
							.setDescription(`${user.username} is already blacklisted.`)
							.setColor("White"),
					],
					ephemeral: true,
				});
			}
			AddBlackList(userId, cmd);
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("User Blacklisted")
						.setDescription(
							`${user.username} added to blacklist for: ${cmd || "all"}.`,
						)
						.setColor("White"),
				],
				ephemeral: true,
			});
		}

		if (method === "Delete") {
			if (!isBlacklisted) {
				return interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Not Blacklisted")
							.setDescription(`${user.username} is not in the blacklist.`)
							.setColor("White"),
					],
					ephemeral: true,
				});
			}
			RemoveBlackList(userId, cmd);
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("User Removed from Blacklist")
						.setDescription(
							`${user.username} removed from blacklist for: ${cmd || "all"}.`,
						)
						.setColor("White"),
				],
				ephemeral: true,
			});
		}
	},
};
