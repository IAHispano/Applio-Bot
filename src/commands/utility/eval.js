const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const client = require("../../bot.js");
const { allowedUserId } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Utility » Eval a code.")
    .setDescriptionLocalizations({
      "es-ES": "Utility » Evalua un código.",
    })
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The code to be executed.")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    if (interaction.user.id !== allowedUserId) {
      return await interaction.editReply(
        "You do not have permission to use this command.",
      );
    }

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
    } catch (err) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`Something went wrong while executing your code.`)
            .setColor("Red"),
        ],
        files: [
          new AttachmentBuilder(Buffer.from(`${err}`, "utf-8"), {
            name: "output.txt",
          }),
        ],
      });
    }
  },
};
