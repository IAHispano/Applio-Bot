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
        .setName("link")
        .setNameLocalizations({
          "es-ES": "enlace",
        })
        .setDescription("Enter the link of model.")
        .setDescriptionLocalizations({
          "es-ES": "Ingrese el enlace del modelo.",
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
          "Select the reason why you believe there has been a problem with the model.",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Seleccione la razón por la que cree que ha habido un problema con el modelo.",
        })
        .setRequired(true)
        .addChoices(
          { name: "The model is bad", value: "The model is bad" },
          { name: "The link is down", value: "The link is down" },
          { name: "Remove model (author's voice preference)", value: "Remove model (author's voice preference)" }
        ),
    )
    .setDMPermission(false),
  async execute(interaction, client) {
    const model = interaction.options.getString("model");
    const link = interaction.options.getString("link");
    const reason = interaction.options.getString("reason");
    const autor = interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle("New report from " + autor)
      .addFields(
        { name: "**Model**", value: `${model}`, inline: true },
        { name: "**Link**", value: `${link}`, inline: true },
        { name: "**Reason**", value: `${reason}`, inline: true },
      )
      .setDescription(`Model reported by ${interaction.user}`)

      .setColor("White")
      .setTimestamp();

    const embed_exito = new EmbedBuilder()
      .setDescription(`Successfully submitted!`)
      .setColor("White")
      .setTimestamp();

    const deleteModel = new ButtonBuilder()
    .setLabel("🗑️ Delete")
    .setStyle(ButtonStyle.Primary)
    .setCustomId(`mdelete_${model}`);

    const row = new ActionRowBuilder().addComponents(
      deleteModel,
    );
    await interaction.reply({
      embeds: [embed_exito],
      ephemeral: true,
    })
    let content = { embeds: [embed], components: [row] };
    await client.shard.broadcastEval(
      (c, context) => {
        const [content] = context;
        try {
          const channel = c.channels.cache.get(
            process.env.AI_HISPANO_REPORT_MODEL_CHANNEL_ID,
          );
          if (channel) {
            channel.send(content);
          }
        } catch (error) {
          console.log(error);
        }
      },
      {
        context: [content],
      },
    );
  },
};
