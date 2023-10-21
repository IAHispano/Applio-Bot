const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { moderatorRoleID } = require("../../config.json");

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
    const usuario = interaction.options.getMember("user");
    const motivo = interaction.options.get("reason");
    const tiempo = interaction.options.get("time");
    const prueba = interaction.options?.get("proof");
    const canal = interaction.guild.channels.cache.get("1117398602239705118");

    const pruebaImg = prueba?.attachment?.url ? prueba.attachment.url : null;

    const member = interaction.member;
    if (member.roles.cache.some((role) => role.id === moderatorRoleID)) {
      const embedSancion = new EmbedBuilder()
        .setTitle("New punishment")
        .addFields(
          { name: "User", value: `${usuario}`, inline: true },
          {
            name: "Staff",
            value: `${interaction.member?.user}`,
            inline: true,
          },
          { name: "Reason", value: `${motivo?.value}`, inline: true },
          { name: "Time", value: `${tiempo?.value}`, inline: true },
        )
        .setImage(pruebaImg)
        .setColor("Blurple")
        .setTimestamp();

      let timeoutMilliseconds = 0;

      switch (tiempo?.value) {
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

      await usuario.timeout(timeoutMilliseconds, motivo?.value);

      canal.send({ embeds: [embedSancion] });

      const embed = new EmbedBuilder()
        .setDescription(
          `Punishment awarded to user ${usuario} for ${tiempo?.value}.`,
        )
        .setColor("Blurple")
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      // El autor no tiene el rol de moderador, responde con un mensaje de error
      return interaction.reply(
        "You don't have permission to use this command.",
      );
    }
  },
};
