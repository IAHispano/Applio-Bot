const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");

const translate = require("translate-google");
const MAX_CONTENT_LENGTH = 2000;

const { Profanity } = require("@2toad/profanity");
const profanity = new Profanity({
	languages: ["en"],
	wholeWord: false,
	grawlix: "*****",
	grawlixChar: "$",
});
profanity.addWords(["strangulation", "gore", "blood", "dismemberment", "to quarter", "porn", "sex", "nude", "naked", "without clothes"]);

async function translatePrompt(prompt) {
	try {
		const translatedPrompt = await translate(prompt, { to: "en" });
		return translatedPrompt;
	} catch (error) {
		console.error("Translation error:", error);
		throw new Error(`Translation failed: ${error.message}`);
	}
}

async function fetchGeneratedImage(prompt) {
	try {
		const response = await fetch(
			"https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
			{
				headers: {
					Authorization: `Bearer ${process.env.HF_TOKEN}`,
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({ inputs: prompt }),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Image generation error: ${response.status} - ${response.statusText}`,
			);
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		return buffer;
	} catch (error) {
		throw error;
	}
}

async function sendSplitMessage(interaction, content, files) {
	const parts = [];
	for (let i = 0; i < content.length; i += MAX_CONTENT_LENGTH) {
		parts.push(content.slice(i, i + MAX_CONTENT_LENGTH));
	}

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		const options = {
			content: part,
			allowedMentions: { parse: [] },
			...(files ? { files: [files] } : {}),
		};

		if (i === 0) {
			await interaction.editReply(options);
		} else {
			await interaction.followUp(options);
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("imagine")
		.setDescription("Generates an image.")
		.addStringOption((option) =>
			option
				.setName("prompt")
				.setDescription("The description of the image you want to generate.")
				.setRequired(true),
		)
		.setDMPermission(false),

	async execute(interaction) {
		const prompt = interaction.options.getString("prompt").trim();
		await interaction.deferReply();

		const translate = await translatePrompt(prompt);
		const filter = profanity.exists(translate);
		if (filter) {
			await interaction.editReply({
				content:
					"Explicit content is not allowed. <:WinkCat:1141558168514723870>",
			});
			return;
		}

		try {
			const imageBuffer = await fetchGeneratedImage(prompt);
			const attachment = new AttachmentBuilder(imageBuffer, {
				name: "generated.png",
			});
			await sendSplitMessage(interaction, `-# Prompt: ${prompt}`, attachment);
		} catch (error) {
			await interaction.editReply({
				content: error.message,
				ephemeral: true,
			});
		}
	},
};
