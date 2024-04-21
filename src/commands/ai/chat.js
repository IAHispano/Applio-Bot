const Groq = require("groq-sdk");
const { SlashCommandBuilder } = require("discord.js");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


async function getGroqChatCompletion(prompt) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: process.env.SYSTEM_PROMPT
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.5,
        max_tokens: 1024,
    });
}



module.exports = {
    data: new SlashCommandBuilder()
        .setName("chat")

        .setDescription("Info » Chat with Applio.")
        .setDescriptionLocalizations({
            "es-ES": "Info » Habla con Applio.",
        })
        .addStringOption((option) =>
            option
                .setName("prompt")
                .setDescription(
                    "The message you want to send to Applio.",
                )
                .setMaxLength(256)
                .setRequired(true),

        )
        .setDMPermission(false),

    async execute(interaction) {
        const prompt = interaction.options.getString("prompt");
        const chatCompletion = await getGroqChatCompletion(prompt);

        let sanitizedContent = chatCompletion.choices[0]?.message?.content
            .replaceAll("@everyone", "everyone")
            .replaceAll("@here", "here");

        if (sanitizedContent.length > 2000) {
            const firstPart = sanitizedContent.slice(0, 2000);
            const secondPart = sanitizedContent.slice(2000);

            await interaction.reply({
                content: firstPart,
            });

            await interaction.followUp({
                content: secondPart,
            });
        } else {
            await interaction.reply({
                content: sanitizedContent,
            });
        }
    }


}
