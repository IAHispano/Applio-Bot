const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("model-maker")
    .setNameLocalizations({
      "es-ES": "creador-modelos",
    })

    .setDescription(
      "AI Hispano » Starts the verification to obtain the 'Model Maker' role.",
    )
    .setDescriptionLocalizations({
      "es-ES":
        "AI Hispano » Inicia la verificación para obtener el rol 'Model Maker'.",
    })
    .setDMPermission(false),
  async execute(interaction) {
    const autor = interaction.user.username;
    const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/user=${autor}`;
    if (interaction.member.roles.cache.has('1142911409202675752')) {
      const embed_fail = new EmbedBuilder()
        .setTitle(`Application not successfully submitted.`)
        .setDescription(`You already have the role of <@&1142911409202675752>.`)
        .setColor("DarkNavy")
        .setTimestamp();
      await interaction
        .reply({
          embeds: [embed_fail],
          ephemeral: true,
      })
      return
    }
    let result
    try {
      const response = await axios.get(url);
      const data = response.data
      const mapped = data.map(result => ({ name: result.name, epochs: result.epochs }));
      result = Array.from(mapped).slice(0, 25);
      if (result.length < 5) {
        const embed_fail = new EmbedBuilder()
        .setTitle(`Application not successfully submitted.`)
        .setDescription(`To obtain the role of <@&1142911409202675752> you have to have 5 models and you are missing ${5 - Number(result.length)}`)
        .setColor("DarkNavy")
        .setTimestamp();

        await interaction
        .reply({
          embeds: [embed_fail],
          ephemeral: true,
        })
        return
      } else if (result.length == 0) {
        const embed_fail = new EmbedBuilder()
        .setTitle(`Application not successfully submitted.`)
        .setDescription(`To obtain the role of <@&1142911409202675752> you have to have 5 models and you have not created any model.`)
        .setColor("DarkNavy")
        .setTimestamp();

        await interaction
        .reply({
          embeds: [embed_fail],
          ephemeral: true,
        })
        return
      }
      const embed = new EmbedBuilder()
      .setTitle("New application by " + autor)
      .setDescription(`Application sent by ${interaction.user}`)
      .setColor("Blurple")
      .setTimestamp();
      
      let fields = result.slice(0, 5).map(({ name, epochs }) => ({ name, value: `Epochs: ${epochs}`, inline: true }));
      if (result.length > 5) fields.push({ name: `And ${result.length - 5} more models...`, value: '\u200B', inline: true });
      embed.addFields(fields);

      const channel = interaction.guild?.channels.cache.get(
        "1143229673996816535",
      );
      const embed_exito = new EmbedBuilder()
      .setDescription(`Application successfully submitted!`)
      .setColor("Blurple")
      .setTimestamp();
      await interaction
      .reply({
        embeds: [embed_exito],
        ephemeral: true,
      })
      .then(() => {
        interaction.member.roles.add("1142911409202675752");
        channel.send({ embeds: [embed] })
      });

    } catch (error){
      console.log(error)
    }
  },
};