const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setNameLocalizations({
			"es-ES": "estadísticas",
		})

		.setDescription("Info » Get statistics about Applio.")
		.setDescriptionLocalizations({
			"es-ES": "Info » Obtén estadísticas sobre Applio.",
		})
		.setDMPermission(false),
	async execute(interaction, client) {
		const cpuUsage = process.cpuUsage().user / process.cpuUsage().system;

		const usedMemoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
			2,
		);

		const GuildsCount = async () => {
			const req = await client.shard.fetchClientValues("guilds.cache.size");
			return req.reduce((p, n) => p + n, 0);
		};

		const UsersCount = async () => {
			const req = await client.shard.broadcastEval((client) =>
				client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
			);
			return req.reduce((p, n) => p + n, 0);
		};

		const ChannelsCount = async () => {
			const req = await client.shard.fetchClientValues("channels.cache.size");
			return req.reduce((p, n) => p + n, 0);
		};

		const getGuildsCount = await GuildsCount();
		const getUsersCount = await UsersCount();
		const getChannelsCount = await ChannelsCount();

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `Applio (${interaction.client.user.id})`,
				iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
			})
			.setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: "Users", value: `${getUsersCount}`, inline: true },
				{
					name: "Guilds",
					value: `${getGuildsCount}`,
					inline: true,
				},
				{
					name: "Channels",
					value: `${getChannelsCount}`,
					inline: true,
				},
				{
					name: "Commands",
					value: `${interaction.client.commands.size}`,
					inline: true,
				},
				{
					name: "Created",
					value: `<t:${Number.parseInt(
						interaction.client.user.createdTimestamp / 1000,
						10,
					)}:R>`,
					inline: true,
				},
				{
					name: "Uptime",
					value: `<t:${Number.parseInt(
						interaction.client.readyTimestamp / 1000,
						10,
					)}:R>`,
					inline: true,
				},
				{
					name: "Version",
					value: `${require("../../../package.json").version}`,
					inline: true,
				},
				{
					name: "RAM Usage",
					value: `${usedMemoryMB} MB`,
					inline: true,
				},
				{
					name: "CPU Usage",
					value: `${cpuUsage.toFixed(2)}%`,
					inline: true,
				},
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setColor("White")
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
