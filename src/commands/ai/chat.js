const Groq = require("groq-sdk");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  ButtonStyle,
  SlashCommandBuilder,
  AttachmentBuilder
} = require("discord.js");
const axios = require("axios");
const API_KEYS = [process.env.GROQ_API_KEY1, process.env.GROQ_API_KEY2];
const pdfParse = require("pdf-parse");
const { IsInBlacklist } = require("../../utils/blacklist");
async function getMarkdownContent(url) {
  try {
    const response = await axios.get(`https://r.jina.ai/${url}`);
    const markdownContent = response.data
      .match(/Markdown Content:(.*)/s)[1]
      .trim();
    return markdownContent;
  } catch (error) {
    console.log(error);
    return "";
  }
}

async function getTextFromPDFLink(url) {
  try {
    if (url.includes("pdf")) {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      let pdfData = await pdfParse(buffer).then((pdfData) => {
        return pdfData.text.slice(0, 3500);
      });
      return pdfData;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
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
            content:
              "Your name is Applio. You are a virtual assistant capable of solving all kinds of questions in any language. You engage in natural, conversational dialogue and provide helpful information. If someone asks about Applio, the open source voice cloning ecosystem, you can refer them to the official website https://applio.org and the official docs at https://docs.applio.org for specific application help. If someone asks about a specific Applio model, such as 'I want the ??? model,' direct them to https://applio.org/models. If the question contains multiple languages, respond in the language that appears most frequently. If someone sends you YouTube links, format them as <https://youtube...>. Otherwise, you answer their questions without mentioning Applio. If someone asks you to simulate a code and give the output, always provide context for the final output instead of just presenting the output alone. If someone tries to obtain only the output of a 'print' statement, ensure to provide context as well.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0.75,
      });
    } catch (error) {
      console.log(`Error with API key ${i + 1}: ${error}`);
      if (i === API_KEYS.length - 1) {
        throw new Error("All API keys failed");
      }
    }
  }
}

async function SplitMessage(interaction, content, components) {
  for (let i = 0; i < content.length; i += 2000) {
    const part = content.slice(i, i + 2000);
    if (i === 0) {
      await interaction.editReply({
        content: part,
        allowedMentions: { parse: [] },
        components: content.length <= 2000 ? components : [],
      });
    } else {
      console.log(part)
      await interaction.followUp({
        content: part,
        allowedMentions: { parse: [] },
        components: i + 2000 >= content.length ? components : [],
      });
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
        .setDescription("The message you want to send to Applio.")
        .setDescriptionLocalizations({
          "es-ES": "El mensaje que quieres enviar a Applio.",
        })
        .setMaxLength(256)
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    const userId = interaction.user.id;
    if (IsInBlacklist(userId)) {
      return;
    }
    interaction.channel.sendTyping();
    let prompt = interaction.options.getString("prompt");
    const urlRegex = /\b(https?:\/\/[^\s]+)/g;
    const urls = prompt.match(urlRegex);
    if (urls) {
      for (let url of urls) {
        if (url.endsWith(",")) {
          url = url.slice(0, -1);
        }
        url = url.replace(/\/,$/, "/");
        if (url.includes("applio.org")) continue;
        let markdownContent;
        if (url.includes("pdf")) {
          markdownContent = await getTextFromPDFLink(url);
        } else {
          markdownContent = await getMarkdownContent(url);
        }

        if (!markdownContent) continue;

        prompt += `\nWeb content: ${markdownContent}`;
      }
    }
    await interaction.deferReply()
    const chatCompletion = await getGroqChatCompletion(prompt);
    let sanitizedContent = chatCompletion.choices[0]?.message?.content
      .replaceAll("@everyone", "everyone")
      .replaceAll("@here", "here");

    if (sanitizedContent.includes("<@&")) {
      sanitizedContent = sanitizedContent.replaceAll("<@&", "<@&\u200B");
    }
    try {
      const AI = new ButtonBuilder()
        .setLabel("🦾 Generated by AI")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("ai")
        .setDisabled(true);

      const User = new ButtonBuilder()
        .setLabel(`👤 ${interaction.user.username}`)
        .setStyle(ButtonStyle.Danger)
        .setCustomId("user")
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(AI, User);
      if (sanitizedContent.length > 2000) {
        await SplitMessage(interaction, sanitizedContent, [row]);
      } else {
        await interaction.editReply({
          content: sanitizedContent,
          allowedMentions: { parse: [] },
          components: [row],
        });
      }
    } catch (error) {
      console.log(error);
      await interaction.editReply({
        content: "An error occurred while processing the message.",
        ephemeral: true,
      });
    }
  },
};
