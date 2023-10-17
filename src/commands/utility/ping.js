const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Utility » Get advanced information about Discord and Bot latency.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "Utility » Obtén información avanzada sobre la latencia de Discord y Bot.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    let circles = {
      good: ":white_check_mark: ",
      okay: ":part_alternation_mark: ",
      bad: ":x: ",
    };

    await interaction.deferReply();

    const pinging = await interaction.editReply({ content: "Pinging..." });

    const ws = interaction.client.ws.ping;
    const msgEdit = Date.now() - pinging.createdTimestamp;

    let days = Math.floor(interaction.client.uptime / 86400000);
    let hours = Math.floor(interaction.client.uptime / 3600000) % 24;
    let minutes = Math.floor(interaction.client.uptime / 60000) % 60;
    let seconds = Math.floor(interaction.client.uptime / 1000) % 60;

    const wsEmoji =
      ws <= 100 ? circles.good : ws <= 200 ? circles.okay : circles.bad;
    const msgEmoji = msgEdit <= 200 ? circles.good : circles.bad;

    const pingEmbed = new EmbedBuilder()
      .setThumbnail(interaction.client.user.displayAvatarURL({ size: 64 }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor("#5865F2")
      .setTimestamp()
      .addFields(
        {
          name: "Websocket Latency",
          value: `${wsEmoji} \`${ws}ms\``,
        },
        {
          name: "API Latency",
          value: `${msgEmoji} \`${msgEdit}ms\``,
        },
        {
          name: `Uptime`,
          value: `⏰ \`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\``,
        },
      );

    await pinging.edit({ embeds: [pingEmbed], content: "\u200b" });
  },
};
