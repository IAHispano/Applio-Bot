const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const voucher_codes = require("voucher-code-generator");
const CodeSchema = require("../../schemas/premium/premiumCode.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setDMPermission(false)
    .setName("premium-codes")
    .setDescription("Premium » Generate new premium codes (Developers only).")
    .setDescriptionLocalizations({
      "es-ES": "Premium » Genera nuevos códigos premium (Sólo desarrolladores).",
    })
    .addStringOption((option) =>
      option
        .setName("plan")
        .setDescription("Select your plan.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona tu plan.",
        })
        .setRequired(true)
        .addChoices(
          { name: "Minutely", value: "minutely" },
          { name: "Daily", value: "daily" },
          { name: "Weekly", value: "weekly" },
          { name: "Monthly", value: "monthly" },
          { name: "Yearly", value: "yearly" },
          { name: "Life Time", value: "lifetime" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of codes to generate.")
        .setDescriptionLocalizations({
          "es-ES": "Número de códigos a generar.",
        })
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription("The user to give a code.")
        .setDescriptionLocalizations({
          "es-ES": "El usuario a regalar un código.",
        })
        .setRequired(false)
    ),
  devOnly: true,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const plan = interaction.options.getString("plan");
    const user = interaction.options.getUser("user");
    const count = interaction.options.getInteger("count");
    const generatedCodes = [];

    for (let i = 0; i < count; i++) {
      const codePremium = voucher_codes.generate({ pattern: "####-####-####" });
      const code = codePremium.toString().toUpperCase();
      const findCode = await CodeSchema.findOne({ code: code });

      if (!findCode) {
        CodeSchema.create({ code: code, plan: plan });
        generatedCodes.push(code);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`New Premium Codes!`)
      .setDescription(generatedCodes.join("\n"))
      .addFields({
        name: `Plan Type`,
        value: `${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        inline: true,
      })
      .setColor("Blurple");

    if (!user) {
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } else {
      try {
        user.send({ embeds: [embed] });
        return interaction.editReply({
          embeds: [
            {
              description: `The codes have been sent to ${user}.`,
            },
          ],
          ephemeral: true,
        });
      } catch (error) {
        return interaction.editReply({
          embeds: [
            {
              description: `I can't send the codes to ${user}.`,
            },
          ],
          ephemeral: true,
        });
      }
    }
  },
};
