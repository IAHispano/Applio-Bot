const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { chatGPT_url } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("AI » Enjoy interacting with ChatGPT from Discord!")
    .setDescriptionLocalizations({
      "es-ES": "AI » ¡Disfruta interactuando con ChatGPT desde Discord!",
    })
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt that will be used for the text generation.")
        .setDescriptionLocalizations({
          "es-ES": "El prompt que se usará para la generación de texto.",
        })
        .setRequired(true)
        .setMaxLength(256),
    )
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();

    const message = interaction.options.get("prompt").value;
    const apiUrl = `${chatGPT_url}/api/chat?q=hi${encodeURIComponent(message)}`;

    try {
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        const chatData = response.data.chat;

        const embed = new EmbedBuilder()
          .setTitle(message)
          .setDescription(chatData)
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor("Blurple")
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.followUp(
          "An error occurred while fetching chat data.",
        );
      }
    } catch (error) {
      console.error(error);
      await interaction.followUp(
        "An error occurred while processing your request.",
      );
    }
  },
};
