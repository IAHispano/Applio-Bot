const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { bardToken, bardPsid } = require("../../config.json");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("AI » Enjoy interacting with ChatGPT from Discord!")
    .setDescriptionLocalizations({
      "es-ES": "AI » ¡Disfruta interactuando con ChatGPT desde Discord!",
    })
    .addStringOption((o) =>
      o
        .setName("prompt")
        .setDescription("The prompt that will be used for the text generation.")
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const prompt = interaction.options.get("prompt").value;

    await interaction.deferReply({ ephemeral: false });
    let input = {
      method: "GET",
      url: "https://google-bard1.p.rapidapi.com/",
      headers: {
        text: prompt,
        lang: "en",
        psid: bardPsid,
        "X-RapidAPI-Key": bardToken,
        "X-RapidAPI-Host": "google-bard1.p.rapidapi.com",
      },
    };

    try {
      const output = await axios.request(input);

      const embed = new EmbedBuilder()
        .setTitle(prompt)
        .setDescription(output.data.response)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor("#5865F2")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      return await interaction.editReply({
        content: `There was an issue getting an AI response! This could be because long requests may be timed out.`,
        ephemeral: true,
      });
    }
  },
};
