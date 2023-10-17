const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("INFO » Get info about a user or yourself.")
    .setDescriptionLocalizations({
      "es-ES": "INFO » Obtén información sobre un usuario o sobre ti mismo.",
    })
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "Specify the user you want to get the avatar from (if you want yours, don't put anything).",
        ),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()

      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .addFields(
        { name: "User", value: `<@${user.id}> (${user.id})`, inline: false },
        {
          name: "Roles",
          value: member.roles.cache.map((role) => `<@&${role.id}>`).join(", "),
        },
        {
          name: "Account created",
          value: `<t:${Math.floor(member.user.createdAt / 1000)}:R>`,
          inline: true,
        },
        {
          name: "Joined server",
          value: `<t:${Math.floor(member.joinedAt / 1000)}:R>`,
          inline: true,
        },
      )

      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
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
