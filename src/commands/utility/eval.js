const {
  SlashCommandBuilder,

  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const client = require("../../bot.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Utility » Eval a code (Developers only).")
    .setDescriptionLocalizations({
      "es-ES": "Utility » Evalua un código (Sólo desarrolladores).",
    })
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("code")
        .setNameLocalizations({
          "es-ES": "código",
        })
        .setDescription("The code to be executed.")
        .setDescriptionLocalizations({
          "es-ES": "El código a ejecutar.",
        })
        .setRequired(true),
    ),
  devOnly: true,
  async execute(interaction) {
    await interaction.deferReply();

    const code = interaction.options.get("code").value;

    try {
      let executedEvalValue = eval(code);

      if (typeof executedEvalValue !== "string")
        executedEvalValue = require("util").inspect(executedEvalValue);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Code executed")
            .setDescription(
              `Successfully executed the code, no errors were found.`,
            )
            .setColor("Green"),
        ],
        files: [
          new AttachmentBuilder(
            Buffer.from(
              `${executedEvalValue}`.replace(
                new RegExp(`${client.token}`, "g"),
                '"[CLIENT TOKEN HIDDEN]"',
              ),
              "utf-8",
            ),
            { name: "output.javascript" },
          ),
        ],
      });
    } catch (error) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`Something went wrong while executing your code.`)
            .setColor("Red"),
        ],
        files: [
          new AttachmentBuilder(Buffer.from(`${error}`, "utf-8"), {
            name: "output.txt",
          }),
        ],
      });
    }
  },
};
