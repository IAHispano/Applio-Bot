const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("model")
    .setNameLocalizations({
      "es-ES": "model",
    })

    .setDescription("AI Hispano » Start the verification of your model.")
    .setDescriptionLocalizations({
      "es-ES": "AI Hispano » Comience la verificación de su modelo.",
    })
    .addStringOption((op) =>
      op
        .setName("name")
        .setDescription("Indicate the name of the model you wish to upload.")
        .setRequired(true),
    )
    .addStringOption((op) =>
      op
        .setName("link")
        .setDescription("Indicate the link of the model you wish to upload.")
        .setRequired(true),
    )
    .addStringOption((op) =>
      op
        .setName("epochs")
        .setDescription(
          "Indicate the number of epochs of the model you want to upload.",
        )
        .setRequired(true),
    )

    .addStringOption((op) =>
      op
        .setName("technology")
        .setDescription(
          "Select the technology where you have created the model.",
        )
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
    .addStringOption((op) =>
      op
        .setName("algorithm")
        .setDescription("Select the algorithm to extract the tone.")
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
    .addAttachmentOption((op) =>
      op
        .setName("image")
        .setDescription(
          "Select the image of the model (in rectangular format and of good quality).",
        )
        .setRequired(true),
    )
    .addAttachmentOption((op) =>
      op
        .setName("audio")
        .setDescription("Upload a sample audio of the model.")
        .setRequired(true),
    )
    .addStringOption((op) =>
      op
        .setName("language")
        .setDescription("Select the language of the model.")
        .addChoices(
          { name: "🇪🇸 Spanish (Spain)", value: "🇪🇸 Spanish (Spain)" },
          { name: "🇲🇽 Spanish (Latin)", value: "🇲🇽 Spanish (Latin)" },
          { name: "🇰🇷 Korean", value: "🇰🇷 Korean" },
          { name: "🇯🇵 Japanese", value: "🇯🇵 Japanese" },
          { name: "🏴 Other languages...", value: "🏴 Other languages..." },
        )
        .setRequired(true),
    )
    .addStringOption((op) =>
      op
        .setName("tags")
        .setDescription(
          "Selecciona la etiqueta que mejor describa a tu modelo.",
        )
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
    ),

  async execute(interaction) {
    let algoritmo = interaction.options?.get("algorithm")?.value;
    const tecnología = interaction.options?.get("technology")?.value;
    const idioma = interaction.options?.get("language")?.value;
    const etiquetas = interaction.options?.get("tags")?.value;
    const epochs = interaction.options?.get("epochs")?.value;
    const nombre = interaction.options?.get("name")?.value;
    const enlace = interaction.options?.get("link")?.value;
    const imagen = interaction.options?.get("image");
    const imagenURL = imagen?.attachment?.url
      ? imagen.attachment.url
      : null ||
        "https://upload.wikimedia.org/wikipedia/commons/7/75/No_image_available.pngx";

    const audio = interaction.options?.get("audio");
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

        .setColor("#5865F2")
        .setFooter({ text: "Thank you for submitting your model!" })
        .setTimestamp();
      await interaction.reply({ embeds: [embed_kits] });
      const successEmbed = new EmbedBuilder()
        .setDescription(
          "<:Check:1139726214114844682> Your model has been successfully submitted! Make sure all the details are correct so that a helper/moderator can review it and upload it soon. Thank you! \n\nIf the image or audio has not been sent correctly, don't forget to attach it manually!",
        )
        .setColor(Colors.Green);
      await interaction.followUp({ embeds: [successEmbed] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`New model of ${autor}`)
      .setDescription(
        `\`\`\`${nombre} (${tecnología} [${algoritmo}] - ${epochs} Epochs)\n${enlace}\n\nModel created by <@${autor_id}>\`\`\`\n> **Tags:** ${idioma}, ${etiquetas}\n > **Audio:** [Click here to download the audio sample!](${audioURL})\n`,
      )
      .setImage(imagenURL || audioURL)
      .setColor("#5865F2")
      .setFooter({ text: "Thank you for submitting your model!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const successEmbed = new EmbedBuilder()
      .setDescription(
        "<:Check:1139726214114844682> Your model has been successfully submitted! Make sure all the details are correct so that a helper/moderator can review it and upload it soon. Thank you! \n\nIf the image or audio has not been sent correctly, don't forget to attach it manually!",
      )
      .setColor(Colors.Green);
    await interaction.followUp({ embeds: [successEmbed] });
  },
};
