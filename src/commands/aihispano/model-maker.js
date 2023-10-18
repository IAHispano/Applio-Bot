const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("model-maker")
    .setNameLocalizations({
      "es-ES": "creador-modelos",
    })

    .setDescription(
      "AI Hispano » Starts the verification to obtain the 'Model Maker' role.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "AI Hispano » Inicia la verificación para obtener el rol 'Model Maker'.",
    })
    .addStringOption((option) =>
      option
        .setName("models")
        .setDescription(
          "Enter the name of the 5 models you have published (separated by commas).",
        )
        .setRequired(true),
    )
    .setDMPermission(false),
  async execute(interaction) {
    const models = interaction.options?.get("models")?.value;
    const autor = interaction.user.username;

    const embed = new EmbedBuilder()
      .setTitle("New application by " + autor)
      .addFields({ name: "**Models**", value: `${models}`, inline: true })
      .setDescription(`Application sent by ${interaction.user}`)
      .setColor("Blurple")
      .setTimestamp();

    const channel = interaction.guild?.channels.cache.get(
      "1143229673996816535",
    );

    const embed_exito = new EmbedBuilder()
      .setDescription(`Application successfully submitted!`)
      .setColor("Blurple")
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
