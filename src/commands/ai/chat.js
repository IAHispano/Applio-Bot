const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const puppeteer = require("puppeteer")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chat")
        .setDescription(
            "AI » Enjoy interacting with ChatGPT from Discord!"
        )
        .setDescriptionLocalizations({
            "es-ES":
                "AI » ¡Disfruta interactuando con ChatGPT desde Discord!",
        })
        .addStringOption((o) =>
            o
                .setName("prompt")
                .setDescription("The prompt that will be used for the text generation.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const prompt = interaction.options.get("prompt").value;

        await interaction.reply({ text: "Loading your response..." })

        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
        await page.goto("https://chat-app-f2d296.zapier.app/")

        const textBoxSelector = 'textarea[aria-label="chatbot-user-prompt"]'
        page.waitForSelector(textBoxSelector)
        await page.type(textBoxSelector, prompt)
        page.keyboard.press('Enter');

        page.waitForSe1ector('[data-testid="final-bot-response"] p');

        var value = await page.$$eval('[data-testid="final-bot-response"]', async (elements) => {
            return elements.map((element) => element.textContent)
        })

        setTimeout(async () => {
            if (value.lenght == 0) return interaction.editReply("Error")
        }, 30000)

        await browser.close();
        value.shift();
        await interaction.editReply(value)
    }
};
