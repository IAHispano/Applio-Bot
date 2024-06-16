const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report-model")
    .setNameLocalizations({
      "es-ES": "reportar-modelo",
    })

    .setDescription(
      "RVC » Report a model if you think there has been a problem with it so that it can be reviewed.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "RVC » Informe de un modelo si cree que ha habido algún problema con él para que pueda ser revisado.",
    })
    .addStringOption((option) =>
      option
        .setName("model")
        .setNameLocalizations({
          "es-ES": "modelo",
        })
        .setDescription("Enter the name of the model that has a problem.")
        .setDescriptionLocalizations({
          "es-ES": "Ingrese el nombre del modelo que tiene un problema.",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setNameLocalizations({
          "es-ES": "razón",
        })
        .setDescription(
          "Enter the reason why you believe there has been a problem with the model.",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Ingrese la razón por la que cree que ha habido un problema con el modelo.",
        })
        .setRequired(true),
    )
    .setDMPermission(false),
  async execute(interaction) {
    const model = interaction.options.getString("model");
    const reason = interaction.options.getString("reason");
    const autor = interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle("New report from " + autor)
      .addFields(
        { name: "**Model**", value: `${model}`, inline: true },
        { name: "**Reason**", value: `${reason}`, inline: true },
      )
      .setDescription(`Model reported by ${interaction.user}`)

      .setColor("White")
      .setTimestamp();
    const channel = interaction.guild.channels.cache.get("1135012781679181935");

    const embed_exito = new EmbedBuilder()
      .setDescription(`Successfully submitted!`)
      .setColor("White")
      .setTimestamp();

    await interaction
      .reply({
        embeds: [embed_exito],
        ephemeral: true,
      })
      .then(() => {
        channel.send({ embeds: [embed] }).then((sentMessage) => {
          sentMessage.react("✅");
          sentMessage.react("❌");
        });
      });
  },
};
