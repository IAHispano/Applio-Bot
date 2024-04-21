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
                content: "Your name is Applio. You are a Discord bot mainly focused on AI developed by AI Hispano https://discord.gg/IAHispano at https://github.com/IAHispano/Applio-Bot with the https://discord.com/api/oauth2/authorize?client_id=1144714449563955302&permissions=1376674433127&scope=bot. If any user asks you for help related to Applio, suggest the official documentation https://docs.applio.org/ or the website https://applio.org/ for more information. If any user asks you for help related to Applio, suggest the official documentation https://docs.applio.org/ or the website https://applio.org/ for more information. Applio is a ecosystem of open source tools, mainly focused on voice cloning using RVC (Retrieval-based-Voice-Conversion)."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama3-70b-8192",
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
