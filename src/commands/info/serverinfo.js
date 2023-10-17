const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("INFO » View information about the current server.")
    .setDescriptionLocalizations({
      "es-ES": "INFO » Obtén información sobre el servidor actual.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    const guild = interaction.guild;
    const icon = guild.iconURL({ dynamic: true }) || "No icon";
    const maxRolesToShow = 30;

    const roles = guild.roles.cache
      .map((role) => `<@&${role.id}>`)
      .slice(0, maxRolesToShow)
      .join(", ");

    const rolesField = roles.length <= 1024 ? roles : roles.substring(0, 1021);

    const embed = new EmbedBuilder()
      .setAuthor({ name: guild.name, iconURL: icon })
      .setDescription(guild.description || "No description")
      .addFields(
        {
          name: "Owner",
          value: `<@${guild.ownerId}> (${guild.ownerId})`,
          inline: true,
        },
        { name: "Language", value: guild.preferredLocale, inline: true },
        {
          name: "Created",
          value: `<t:${Math.floor(guild.createdAt / 1000)}:R>`,
          inline: true,
        },
        {
          name: "Level",
          value: `${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`,
          inline: true,
        },
        {
          name: "Vanity URL",
          value: guild.vanityURLCode
            ? `[${guild.vanityURLCode}](https://discord.gg/${guild.vanityURLCode})`
            : "No vanity URL",
          inline: true,
        },
        {
          name: "Members",
          value: `${guild.memberCount}`,
          inline: true,
        },
        {
          name: "Roles",
          value: rolesField + "...",
        },
      )
      .setImage(guild.bannerURL({ dynamic: true, size: 4096 }))
      .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor("#5865F2")
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};
