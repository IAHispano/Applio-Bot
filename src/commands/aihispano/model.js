const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("model")
    .setNameLocalizations({
      "es-ES": "modelo",
    })

    .setDescription("AI Hispano » Start the verification of your model.")
    .setDescriptionLocalizations({
      "es-ES": "AI Hispano » Comience la verificación de su modelo.",
    })
    .addStringOption((option) =>
      option
        .setName("name")
        .setNameLocalizations({
          "es-ES": "nombre",
        })
        .setDescription("Indicate the name of the model you wish to upload.")
        .setDescriptionLocalizations({
          "es-ES": "Indique el nombre del modelo que desea publicar.",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("link")
        .setNameLocalizations({
          "es-ES": "enlace",
        })
        .setDescription("Indicate the link of the model you wish to upload.")
        .setDescriptionLocalizations({
          "es-ES": "Indique el enlace del modelo que desea publicar.",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("epochs")

        .setDescription(
          "Indicate the number of epochs of the model you want to upload.",
        )
        .setDescriptionLocalizations({
          "es-ES": "Indique el número de epochs del modelo que desea publicar.",
        })
        .setRequired(true),
    )

    .addStringOption((option) =>
      option
        .setName("technology")
        .setNameLocalizations({
          "es-ES": "tecnología",
        })
        .setDescription(
          "Select the technology where you have created the model.",
        )
        .setDescriptionLocalizations({
          "es-ES": "Seleccione la tecnología donde ha creado el modelo.",
        })
        .addChoices(
          {
            name: "Kits.AI",
            value: "Kits.AI",
          },
          {
            name: "RVC",
            value: "RVC",
          },
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("algorithm")
        .setNameLocalizations({
          "es-ES": "algoritmo",
        })
        .setDescription("Select the algorithm to extract the tone.")
        .setDescriptionLocalizations({
          "es-ES": "Seleccione el algoritmo para extraer el tono.",
        })
        .addChoices(
          {
            name: "Harvest",
            value: "Harvest",
          },
          {
            name: "PM",
            value: "PM",
          },
          { name: "Dio", value: "Dio" },
          { name: "Crepe", value: "Crepe" },
          { name: "Crepe-tiny", value: "Crepe-tiny" },
          { name: "Mangio-crepe", value: "Mangio-crepe" },
          { name: "Mangio-crepe-tiny", value: "Mangio-crepe-tiny" },
          { name: "Rmvpe", value: "Rmvpe" },
          { name: "Rmvpe_gpu", value: "Rmvpe_gpu" },
        )
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setNameLocalizations({
          "es-ES": "imagen",
        })
        .setDescription(
          "Select the image of the model (in rectangular format and of good quality).",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Seleccione la imagen del modelo (en formato rectangular y de buena calidad).",
        })
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("audio")
        .setDescription("Upload a sample audio of the model.")
        .setDescriptionLocalizations({
          "es-ES": "Sube una muestra de audio del modelo.",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setNameLocalizations({
          "es-ES": "idioma",
        })
        .setDescription("Select the language of the model.")
        .setDescriptionLocalizations({
          "es-ES": "Seleccione el idioma del modelo.",
        })
        .addChoices(
          { name: "🇪🇸 Spanish (Spain)", value: "🇪🇸 Spanish (Spain)" },
          { name: "🇲🇽 Spanish (Latin)", value: "🇲🇽 Spanish (Latin)" },
          { name: "🇰🇷 Korean", value: "🇰🇷 Korean" },
          { name: "🇯🇵 Japanese", value: "🇯🇵 Japanese" },
          { name: "🏴 Other languages...", value: "🏴 Other languages..." },
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("tags")
        .setNameLocalizations({
          "es-ES": "etiquetas",
        })
        .setDescription("Select the tag that best describes your model.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona la etiqueta que mejor describa a tu modelo.",
        })
        .addChoices(
          { name: "😂 Meme", value: "😂 Meme" },
          { name: "🎤 Rapper", value: "🎤 Rapper" },
          { name: "🎶 Singer", value: "🎶 Singer" },
          { name: "😶 Personal voice", value: "😶 Personal voice" },
          { name: "💃 Actor", value: "💃 Actor" },
          { name: "🎰 Anime", value: "🎰 Anime" },
          { name: "🪄 Character", value: "🪄 Character" },
          { name: "🎷 Instrument", value: "🎷 Instrument" },
        )
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    let algoritmo = interaction.options.getString("algorithm");
    const tecnología = interaction.options.getString("technology");
    const idioma = interaction.options.getString("language");
    const etiquetas = interaction.options.getString("tags");
    const epochs = interaction.options.getString("epochs");
    const nombre = interaction.options.getString("name");
    const enlace = interaction.options.getString("link");
    const imagen = interaction.options.get("image");
    const imagenURL = imagen?.attachment?.url
      ? imagen.attachment.url
      : null ||
        "https://upload.wikimedia.org/wikipedia/commons/7/75/No_image_available.pngx";

    const audio = interaction.options.get("audio");
    const audioURL = audio?.attachment?.url ? audio.attachment.url : null;

    const autor_id = interaction.user.id;
    const autor = interaction.user.username;

    if (enlace.includes("kits.ai")) {
      const embed_kits = new EmbedBuilder()
        .setTitle(`New model of ${autor}`)
        .setDescription(
          `
              \`\`\`${nombre} (${tecnología})\n${enlace}\n\nModel created by <@${autor_id}>\`\`\`\n> **Tags:** ${idioma}, ${etiquetas}\n > **Audio:** [Click here to download the audio sample!](${audioURL})
              `,
        )
        .setImage(imagenURL || audioURL)

        .setColor("Blurple")
        .setFooter({ text: "Thank you for submitting your model!" })
        .setTimestamp();
      await interaction.reply({ embeds: [embed_kits] });
      const successEmbed = new EmbedBuilder()
        .setDescription(
          "<:Check:1139726214114844682> Your model has been successfully submitted! Make sure all the details are correct so that a helper/moderator can review it and upload it soon. Thank you! \n\nIf the image or audio has not been sent correctly, don't forget to attach it manually!",
        )
        .setColor("Green");
      await interaction.followUp({ embeds: [successEmbed] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`New model of ${autor}`)
      .setDescription(
        `\`\`\`${nombre} (${tecnología} [${algoritmo}] - ${epochs} Epochs)\n${enlace}\n\nModel created by <@${autor_id}>\`\`\`\n> **Tags:** ${idioma}, ${etiquetas}\n > **Audio:** [Click here to download the audio sample!](${audioURL})\n`,
      )
      .setImage(imagenURL || audioURL)
      .setColor("Blurple")
      .setFooter({ text: "Thank you for submitting your model!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const successEmbed = new EmbedBuilder()
      .setDescription(
        "<:Check:1139726214114844682> Your model has been successfully submitted! Make sure all the details are correct so that a helper/moderator can review it and upload it soon. Thank you! \n\nIf the image or audio has not been sent correctly, don't forget to attach it manually!",
      )
      .setColor("Green");
    await interaction.followUp({ embeds: [successEmbed] });
  },
};
