const Groq = require("groq-sdk");
const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function getMarkdownContent(url) {
    const response = await axios.get(`https://r.jina.ai/${url}`);
    const markdownContent = response.data.match(/Markdown Content:(.*)/s)[1].trim();
    return markdownContent;
}

async function getGroqChatCompletion(prompt) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Your name is Applio. You are a virtual assistant able to solve all kinds of questions in any language. Applio is an open source voice cloning ecosystem, if someone asks you about it, you can refer them to the official website https://applio.org as well as provide the official docs https://docs.applio.org in case someone asks you for specific Applio application help."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama3-70b-8192",
        temperature: 0.6,
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
                .setDescriptionLocalizations({
                    "es-ES": "El mensaje que quieres enviar a Applio.",
                })
                .setMaxLength(256)
                .setRequired(true),
        )
        .setDMPermission(false),

    async execute(interaction) {
        interaction.channel.sendTyping()
        let prompt = interaction.options.getString("prompt");
        const urlRegex = /\b(https?:\/\/[^\s]+)/g;
        const urls = prompt.match(urlRegex);
        if (urls) {
            for (const url of urls) {
                const markdownContent = await getMarkdownContent(url);
                prompt += `\nWeb content: ${markdownContent}`;
            }
        }
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