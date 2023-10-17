const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { prodia_token } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("imagine")
    .setNameLocalizations({
      "es-ES": "imagina",
    })
    .setDescription(
      "AI » Generates an image with AI based on the description you provide.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "AI » Genera una imagen con IA basada en la descripción que proporciones.",
    })
    .addStringOption((o) =>
      o
        .setName("prompt")
        .setDescription("The description of the image you want to generate.")
        .setRequired(true),
    )
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.get("prompt").value;
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-Prodia-Key": prodia_token,
      },
      body: JSON.stringify({
        prompt: `${prompt}`,
      }),
    };

    fetch("https://api.prodia.com/v1/job", options)
      .then((response) => response.json())
      .then((jobResponse) => {
        const jobId = jobResponse.job;

        const options2 = {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-Prodia-Key": prodia_token,
          },
        };

        setTimeout(() => {
          fetch(`https://api.prodia.com/v1/job/${jobId}`, options2)
            .then((response) => response.json())
            .then(async (response) => {
              const image = response.imageUrl;
              const embed = new EmbedBuilder()
                .setImage(`${image}`)
                .setTitle("Here's your image!")
                .setDescription(`> ${prompt}`)
                .setFooter({
                  text: `Requested by ${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setColor("#5865F2")
                .setTimestamp();
              await interaction.followUp({ embeds: [embed] });
            })
            .catch((err) => console.error(err));
        }, 5000);
      })
      .catch((err) => console.error(err));
  },
};
