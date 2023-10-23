const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const Schema = require("../../schemas/moderation/auditLog.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("auditlog-delete")
    .setNameLocalizations({
      "es-ES": "borrar-auditlog",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Moderation » Delete the audit log system in your server.")
    .setDescriptionLocalizations({
      "es-ES": "Moderation » Borra el sistema de auditoría en tu servidor.",
    }),
  async execute(interaction) {
    const { guild } = interaction;

    const data = await Schema.findOne({
      Guild: guild.id,
    });
    if (!data) {
      return await interaction.reply("You dont have a audit log system here!");
    }
    const embed = new EmbedBuilder()
      .setTitle("Audit Log Setup")
      .setDescription(`Your Audit Log has been deleted!`)
      .setColor("Blurple")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()

    await Schema.deleteMany({
      Guild: guild.id,
    });

    return await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
