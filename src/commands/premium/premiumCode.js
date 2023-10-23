const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const voucher_codes = require("voucher-code-generator");
const CodeSchema = require("../../schemas/premiumCode.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium-code")
    .setDescription("Generate premium user code")
    .addStringOption((option) =>
      option
        .setName("plan")
        .setDescription("Select your plan")
        .setRequired(true)
        .addChoices(
          { name: "Minutely", value: "minutely" },
          { name: "Daily", value: "daily" },
          { name: "Weekly", value: "weekly" },
          { name: "Monthly", value: "monthly" },
          { name: "Yearly", value: "yearly" },
          { name: "Life Time", value: "lifetime" },
        ),
    ),
  devOnly: true,

  async execute(interaction) {
    await interaction.deferReply();

    const plan = interaction.options.getString("plan");
    const codePremium = voucher_codes.generate({ pattern: "####-####-####" });
    const code = codePremium.toString().toUpperCase();
    const findCode = await CodeSchema.findOne({ code: code });

    if (!findCode) {
      CodeSchema.create({ code: code, plan: plan });
    }

    const embed = new EmbedBuilder()
      .setTitle(`New Premium Code!`)
      .setDescription(code)
      .addFields({
        name: `Plan Type`,
        value: `${plan.capitalize()}`,
        inline: true,
      })
      .setColor("Blurple");

    await interaction.editReply({ embeds: [embed] });
  },
};
