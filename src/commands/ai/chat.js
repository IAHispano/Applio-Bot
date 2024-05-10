const Groq = require("groq-sdk");
const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const API_KEYS = [process.env.GROQ_API_KEY1, process.env.GROQ_API_KEY2];
const pdfParse = require('pdf-parse');

async function getMarkdownContent(url) {
    const response = await axios.get(`https://r.jina.ai/${url}`);
    const markdownContent = response.data.match(/Markdown Content:(.*)/s)[1].trim();
    return markdownContent;
}
async function getTextFromPDFLink(url) {
    try {
        if (url.includes('pdf')) {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            let pdfData = await pdfParse(buffer).then((pdfData) => {
                return pdfData.text.slice(0, 3500);
            });
            return pdfData;
        } else {
            return null
        }
    } catch (error) {
        console.log(error)
        return null
    }
}

async function getGroqChatCompletion(prompt) {
    for (let i = 0; i < API_KEYS.length; i++) {
        try {
            const groq = new Groq({ apiKey: API_KEYS[i] });
            return await groq.chat.completions.create({
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
        } catch (error) {
            console.log(`Error with API key ${i + 1}: ${error}`);
            if (i === API_KEYS.length - 1) {
                throw new Error('All API keys failed');
            }
        }
    }
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
                let markdownContent
                if (url.includes('pdf')) {
                    markdownContent = await getTextFromPDFLink(url);
                } else {
                    markdownContent = await getMarkdownContent(url);
                }

                if (!markdownContent) continue;
                
                prompt += `\nWeb content: ${markdownContent}`;
            }
        }
        const chatCompletion = await getGroqChatCompletion(prompt);
        let sanitizedContent = chatCompletion.choices[0]?.message?.content
            .replaceAll("@everyone", "everyone")
            .replaceAll("@here", "here");
        
        if (sanitizedContent.includes("<@&")) {
            sanitizedContent = sanitizedContent.replaceAll("<@&", "<@&\u200B");
        }

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
