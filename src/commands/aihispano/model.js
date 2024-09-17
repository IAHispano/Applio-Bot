const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

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
          { name: "Rmvpe", value: "Rmvpe" },
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
          { name: "🇺🇸 English", value: "🇺🇸 English" },
          { name: "🇪🇸 Spanish", value: "🇪🇸 Spanish" },
          { name: "🇲🇽 Latin America", value: "🇲🇽 Latin America" }, 
          { name: "🌎 Other language...", value: "🌎 Other languages..." },
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
          { name: "🤣 Meme", value: "🤣 Meme" },
          { name: "🎤 Artist", value: "🎤 Artist" }, 
          { name: "👀 Character", value: "👀 Character" }, 
          { name: "🎷 Instrument", value: "🎷 Instrument" },
          { name: "🪁 Anime", value: "🪁 Anime" },
          { name: "🛡️ TITAN-Medium", value: "🛡️ TITAN-Medium" }, 
          { name: "🔝 High-Quality", value: "🔝 High-Quality" },
          { name: "📑 TTS", value: "📑 TTS" },
          { name: "⚡ w-okada", value: "⚡ w-okada" }
        )
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {

    if(interaction.channel.parentId !== "1103055144339382372" ) return await interaction.reply({ content: "No Channel Allowed", ephemeral: true})
    let algoritmo = interaction.options.getString("algorithm");
    const idioma = interaction.options.getString("language");
    const etiquetas = interaction.options.getString("tags");
    const epochs = interaction.options.getString("epochs");
    const nombre = interaction.options.getString("name");
    const enlace = interaction.options.getString("link");
    const imagen = interaction.options.get("image");
    const imagenURL = imagen?.attachment?.url
      ? imagen.attachment.url
      : null ||
        "https://upload.wikimedia.org/wikipedia/commons/7/75/No_image_available.png";

    const audio = interaction.options.get("audio");
    const audioURL = audio?.attachment?.url ? audio.attachment.url : null;

    const autor_id = interaction.user.id;
    const autor = interaction.user.username;

    const View_Audio = new ButtonBuilder()
    .setLabel("🎵 View Audio")
    .setStyle(ButtonStyle.Link)
    .setURL(`https://audio-player-qtacpmvp5-deiants-projects.vercel.app/?link=${audioURL}`)
    const EditEmbed = new ButtonBuilder()
    .setLabel("🔨 Edit Post")
    .setStyle(ButtonStyle.Danger)
    .setCustomId(`epost_${interaction.user.id}`)
    const Upload = new ButtonBuilder()
    .setLabel("Upload Model")
    .setStyle(ButtonStyle.Primary)
    .setCustomId(`mupload`)
    const row = new ActionRowBuilder().addComponents(View_Audio, EditEmbed, Upload);

    const embed = new EmbedBuilder()
        .setTitle(`New model of ${autor}`)
        .addFields(
          { name: "Title", value: nombre, inline: true },
          { name: "Epochs", value: epochs || "Unknown", inline: true },
          { name: "Algorithm", value: algoritmo, inline: true },
          { name: "Link", value: enlace, inline: true },
        )
        .setDescription(
          `### Model Information\n\`\`\`${nombre} (RVC [${algoritmo}] - ${epochs} Epochs)\n${enlace}\n\nModel created by <@${autor_id}>\`\`\`\n> **Tags:** ${idioma}, ${etiquetas}\n`,
        )
        .setImage(imagenURL)
        .setColor("White")
        .setFooter({ text: "Thank you for submitting your model!" })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], components: [row]});
  },
};
