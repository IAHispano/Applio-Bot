const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("AI » Enjoy interacting with an AI chat from Discord!")
    .setDescriptionLocalizations({
      "es-ES": "AI » ¡Disfruta interactuando con un chat de IA desde Discord!",
    })
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt that will be used for the text generation.")
        .setDescriptionLocalizations({
          "es-ES": "El prompt que se usará para la generación de texto.",
        })
        .setRequired(true)
        .setMaxLength(512),
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setNameLocalizations({
          "es-ES": "modelo",
        })
        .setDescription("The model for the AI response.")
        .setDescriptionLocalizations({
          "es-ES": "El modelo para la respuesta de la IA.",
        })
        .addChoices({ name: "gpt-3.5-turbo (default)", value: "gpt-3.5-turbo" })
        .addChoices({ name: "gpt-3.5-turbo-0613", value: "gpt-3.5-turbo-0613" })
        .addChoices({ name: "gpt-3.5-turbo-16k", value: "gpt-3.5-turbo-16k" })
        .addChoices({
          name: "gpt-3.5-turbo-16k-0613",
          value: "gpt-3.5-turbo-16k-0613",
        })
        .addChoices({ name: "santacoder", value: "santacoder" })
        .addChoices({ name: "bloom", value: "bloom" })
        .addChoices({ name: "command-nightly", value: "command-nightly" })
        .addChoices({ name: "gpt-neox-20b", value: "gpt-neox-20b" })
        .addChoices({ name: "flan-t5-xxl", value: "flan-t5-xxl" })
        .addChoices({ name: "code-davinci-002", value: "code-davinci-002" })
        .addChoices({ name: "text-ada-001", value: "text-ada-001" })
        .addChoices({ name: "text-babbage-001", value: "text-babbage-001" })
        .addChoices({ name: "text-curie-001", value: "text-curie-001" })
        .addChoices({ name: "text-davinci-002", value: "text-davinci-002" })
        .addChoices({ name: "text-davinci-003", value: "text-davinci-003" })
        .addChoices({ name: "llama13b-v2-chat", value: "llama13b-v2-chat" })
        .addChoices({ name: "llama7b-v2-chat", value: "llama7b-v2-chat" })
        .addChoices({
          name: "oasst-sft-1-pythia-12b",
          value: "oasst-sft-1-pythia-12b",
        })
        .addChoices({
          name: "oasst-sft-4-pythia-12b-epoch-3.5",
          value: "oasst-sft-4-pythia-12b-epoch-3.5",
        })
        .addChoices({
          name: "command-light-nightly",
          value: "command-light-nightly",
        }),
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");
    let model = interaction.options.getString("model");

    if (model) {
      model = model;
    } else if (!model) {
      model = "gpt-3.5-turbo";
    }

    const url = "http://195.88.218.231:4453";

    const data = {
      username: interaction.user.username,
      botname: client.user.username,
      model: model,
      messages: [
        {
          role: "Bot",
          content: "You are a helpful assistant.",
        },
        {
          role: "User",
          content: prompt,
        },
      ],
    };

    try {
      const output = await axios
        .post(url, data, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .catch(async (e) => {
          console.log(e);
          await interaction.editReply({
            content: `Request failed with status code: **${output.status}**`,
          });
        });

      const message = output.data.choices[0].message.content;

      if (message.length === 0) {
        return;
      }

      const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(`${message}`)
        .setFooter({ text: `${model}` })
        .setTimestamp()
        .setTitle(`> ${prompt}`);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: "An error has occurred, try again later.",
      });
      console.log(error);
    }
  },
};
