const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moment = require("moment");
const Code = require("../../schemas/premiumCode.js");
const User = require("../../schemas/premiumUser.js");
const soycanvas = require("soycanvas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium-redeem")
    .setDescription("Redeem your Premium Code.")
    .setDescriptionLocalizations({
      "es-ES": "Canjea tu código Premium.",
    })
    .addStringOption((option) =>
      option
        .setName("code")
        .setNameLocalizations({
          "es-ES": "código",
        })
        .setDescription("Introduce your Premium Code.")
        .setDescriptionLocalizations({
          "es-ES": "Introduce tu código Premium.",
        })
        .setRequired(true),
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ fetchReply: true });

      const input = interaction.options.getString("code");
      const user = await User.findOne({ Id: interaction.user.id });
      const code = await Code.findOne({ code: input.toUpperCase() });
      const premiumID = soycanvas.Util.captchaKey(12);

      if (user && user.isPremium) {
        const embed = new EmbedBuilder()
          .setColor("Burple")
          .setDescription(`You are already a premium user.`);
        return interaction.editReply({ embeds: [embed], ephemeral: true });
      }

      if (code) {
        const plan = code.plan;
        const planDurations = {
          minutely: 300000,
          daily: 86400000,
          weekly: 604800000,
          monthly: 2592000000,
          yearly: 31536000000,
          lifetime: Number.MAX_SAFE_INTEGER, // A very large number for "lifetime"
        };

        const planDuration = planDurations[plan];
        const expiresAt = moment()
          .add(planDuration, "milliseconds")
          .format("dddd, MMMM Do YYYY HH:mm:ss");

        if (user) {
          user.isPremium = true;
          user.PremID = premiumID;
          user.redeemedAt = Date.now();
          user.expiresAt = Date.now() + planDuration;
          user.plan = plan;
          user.save();
        } else {
          new User({
            Id: interaction.user.id,
            isPremium: true,
            PremID: premiumID,
            redeemedAt: Date.now(),
            expiresAt: Date.now() + planDuration,
            plan: plan,
          }).save();
        }

        await code.deleteOne();

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `Premium Redeemed!`,
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setDescription(
            `🎉 Congratulations ${interaction.user}, you've successfully redeemed a premium code with the following details!`,
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setColor("Blurple")
          .setTimestamp()
          .addFields([
            {
              name: `Redeemed By`,
              value: `${interaction.user}`,
              inline: true,
            },
            {
              name: `Plan Type`,
              value: `${plan.toUpperCase()}`,
              inline: true,
            },
            {
              name: `Expires At`,
              value: `\`\`\`${expiresAt}\`\`\``,
              inline: false,
            },
            {
              name: `Premium ID`,
              value: `\`\`\`${premiumID}\`\`\``,
              inline: false,
            },
          ]);

        await interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `The provided code was invalid, please use a valid one.`,
          );

        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
    }
  },
};
