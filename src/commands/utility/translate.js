const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} = require("discord.js");

const translate = require("translate-google");
const ISO6391 = require("iso-639-1");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("translate")
    .setNameLocalizations({
      "es-ES": "traducir",
    })
    .setDescription("Transalate a text to any language.")
    .setDescriptionLocalizations({
      "es-ES": "Traduce un texto a cualquier idioma.",
    })
    .addStringOption((option) =>
      option
        .setName("text")
        .setNameLocalizations({
          "es-ES": "texto",
        })
        .setDescription("Introduce the text to translate.")
        .setDescriptionLocalizations({
          "es-ES": "Introduce el texto a traducir.",
        })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setNameLocalizations({
          "es-ES": "idioma",
        })
        .setDescription("Introduce the language to translate.")
        .setDescriptionLocalizations({
          "es-ES": "Introduce el idioma a traducir.",
        })
        .addChoices(
          { name: "English", value: "en" },
          { name: "Spanish", value: "es" },
          { name: "Chinese", value: "zh-cn" },
          { name: "Filipino", value: "tl" },
          { name: "Hindi", value: "hi" },
          { name: "Arabic", value: "ar" },
          { name: "Bengali", value: "bn" },
          { name: "Portuguese", value: "pt" },
          { name: "Russian", value: "ru" },
          { name: "Japanese", value: "ja" },
          { name: "Punjabi", value: "ma" },
          { name: "German", value: "de" },
          { name: "Javanese", value: "jw" },
          { name: "Korean", value: "ko" },
          { name: "French", value: "fr" },
          { name: "Telugu", value: "te" },
          { name: "Marathi", value: "mr" },
          { name: "Turkish", value: "tr" },
          { name: "Tamil", value: "ta" },
          { name: "Vietnamese", value: "vi" },
        )

        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const text = interaction.options.getString("text");
    const language = interaction.options.getString("language");

    translate(text, { to: language })
      .then((result) => {
        const languageName = ISO6391.getName(language) || language;
        const embed = new EmbedBuilder()
          .setTitle(`Translated to ${languageName}`)
          .setDescription(`> ${text}`)
          .addFields({
            name: `Translated message`,
            value: `${result}`,
          })
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor("Blurple")
          .setTimestamp();
        interaction.reply({ embeds: [embed] });
      })
      .catch((error) => {
        console.error(error);
      });
  },
};
