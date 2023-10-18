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
  async execute(interaction) {
    const totalMembers = await interaction.client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0,
    );
    const cpuUsage = process.cpuUsage().user / process.cpuUsage().system;

    const usedMemoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
      2,
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Applio (${interaction.client.user.id})`,
        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Users", value: `${totalMembers}`, inline: true },
        {
          name: "Servers",
          value: `${interaction.client.guilds.cache.size}`,
          inline: true,
        },
        {
          name: "Channels",
          value: `${interaction.client.channels.cache.size}`,
          inline: true,
        },
        {
          name: "Commands",
          value: `${interaction.client.commands.size}`,
          inline: true,
        },
        {
          name: "Created",
          value: `<t:${parseInt(
            interaction.client.user.createdTimestamp / 1000,
            10,
          )}:R>`,
          inline: true,
        },
        {
          name: "Uptime",
          value: `<t:${parseInt(
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
      .setColor("Blurple")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
