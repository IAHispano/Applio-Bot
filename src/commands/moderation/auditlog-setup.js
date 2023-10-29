const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const Schema = require("../../schemas/moderation/auditLog.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("auditlog-setup")
    .setNameLocalizations({
      "es-ES": "configurar-auditlog",
    })
    .setDescription("Moderation » Setup the audit log system in your server.")
    .setDescriptionLocalizations({
      "es-ES": "Moderation » Configura el sistema de auditoría en tu servidor.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel for the Audit Log.")
        .setDescriptionLocalizations({
          "es-ES": "El canal para el Audit Log.",
        })
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),
  async execute(interaction) {
    const { options, guild } = interaction;
    const channel = options.getChannel("channel");

    const data = await Schema.findOne({
      Guild: guild.id,
    });
    if (data) {
      return await interaction.reply(
        "You have already a audit log system here!",
      );
    }
    const embed = new EmbedBuilder()
      .setTitle("Audit Log Setup")
      .setDescription(
        `The Audit Log has been setup in ${channel}!\n\n**Note:** If you delete the channel, the audit log system will be deleted!`,
      )
      .setColor("Blurple")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await Schema.create({
      Guild: guild.id,
      Channel: channel.id,
    });

    return await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
