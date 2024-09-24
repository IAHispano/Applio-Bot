const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_TOKEN,
);

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
		if (
			interaction.member.roles.cache.has(
				process.env.AI_HISPANO_MODEL_MAKER_ROLE_ID,
			)
		) {
			const embed_fail = new EmbedBuilder()
				.setTitle(`Application not successfully submitted.`)
				.setDescription(`You already have the role <@&${process.env.AI_HISPANO_MODEL_MAKER_ROLE_ID}>.`)
				.setColor("White")
				.setTimestamp();
			await interaction.reply({
				embeds: [embed_fail],
				ephemeral: true,
			});
			return;
		}
		let result;
		try {
			const { data, error } = await supabase
				.from("models")
				.select("*")
				.filter("author_username", "ilike", `%${autor}%`)
				.limit(5);
			if (error) {
				console.error("Error fetching models:", error);
				return;
			}
			const mapped = data.map((result) => ({
				name: result.name,
				epochs: result.epochs,
			}));
			result = Array.from(mapped).slice(0, 25);
			if (result.length < 5) {
				const embed_fail = new EmbedBuilder()
					.setTitle(`Application not successfully submitted.`)
					.setDescription(
						`To obtain the role <@&${process.env.AI_HISPANO_MODEL_MAKER_ROLE_ID}> you have to have 5 models and you are missing ${
							5 - Number(result.length)
						}`,
					)
					.setColor("White")
					.setTimestamp();

				await interaction.reply({
					embeds: [embed_fail],
					ephemeral: true,
				});
				return;
			} else if (result.length == 0) {
				const embed_fail = new EmbedBuilder()
					.setTitle(`Application not successfully submitted.`)
					.setDescription(
						`To obtain the role <@&${process.env.AI_HISPANO_MODEL_MAKER_ROLE_ID}> you have to have 5 models and you have not created any model.`,
					)
					.setColor("White")
					.setTimestamp();

				await interaction.reply({
					embeds: [embed_fail],
					ephemeral: true,
				});
				return;
			}
			const embed = new EmbedBuilder()
				.setTitle("New application by " + autor)
				.setDescription(`Application sent by ${interaction.user}`)
				.setColor("White")
				.setTimestamp();

			let fields = result.slice(0, 5).map(({ name, epochs }) => ({
				name,
				value: `Epochs: ${epochs}`,
				inline: true,
			}));
			if (result.length > 5)
				fields.push({
					name: `And ${result.length - 5} more models...`,
					value: "\u200B",
					inline: true,
				});
			embed.addFields(fields);

			const channel = interaction.guild?.channels.cache.get(
				process.env.AI_HISPANO_MODEL_MAKER_CHANNEL_ID,
			);
			const embed_exito = new EmbedBuilder()
				.setDescription(`Application successfully submitted!`)
				.setColor("White")
				.setTimestamp();
			await interaction
				.reply({
					embeds: [embed_exito],
					ephemeral: true,
				})
				.then(async () => {
					interaction.member.roles.add(
						process.env.AI_HISPANO_MODEL_MAKER_ROLE_ID,
					);
					const { data, error } = await supabase
						.from("profiles")
						.update({ "model-maker": true })
						.eq("full_name", autor);
					channel.send({ embeds: [embed] });
				});
		} catch (error) {
			console.log(error);
		}
	},
};
