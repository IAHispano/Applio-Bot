const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");
function GetTag(text) {
  let Langs = {
    "ES": "Spanish",
    "EN": "English",
    "JP": "Japanese",
    "KR": "Korean",
    "PT": "Portuguese",
    "FR": "French",
    "TR": "Turkish",
    "RU": "Russian",
    "IT": "Italian",
    "PL": "Polish",
    "OTHER": "Other"
  };
  let parts = text.split(",");
  for (let part of parts) {
    let trim = part.trim(); 
    if (Langs.hasOwnProperty(trim)) {
      return Langs[trim];
    }
  }
  return "Unknown";
}

async function AdMsg(msg) {
  try {
    await msg.channel.send({
      content: "If you want to support applio's project, you can do it through <https://applio.org/premium> !",
      reply: { messageReference: msg.id },
    });
  } catch {}
  
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setNameLocalizations({
      "es-ES": "buscador",
    })
    .setDescription("RVC » Search any voice model in a huge database.")
    .setDescriptionLocalizations({
      "es-ES":
        "RVC » Busca cualquier modelo de voz en una enorme base de datos.",
    })
    .addStringOption((option) =>
      option
        .setName("model")
        .setAutocomplete(true)
        .setNameLocalizations({
          "es-ES": "modelo",
        })
        .setDescription("Enter the name of the model you wish to search for.")
        .setDescriptionLocalizations({
          "es-ES": "Ingrese el nombre del modelo que desea buscar.",
        })
        .setRequired(true),
    )
    .setDMPermission(false),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    try {
      if (focusedValue.length === 0) {
        const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/perpage=25/page=1?type=rvc`;
        const response = await axios.get(url);
        const rdata = response.data;
        const mapped = new Set(rdata.map((result) => result.name));
        const choices = Array.from(mapped).slice(0, 25);
        await interaction.respond(
          choices.map((choice) => ({ name: choice, value: choice })),
        );
        return;
      } else if (focusedValue.length < 3) {
        return;
      }
      const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/search?name=${focusedValue}&type=rvc`;
      const response = await axios.get(url);
      const rdata = response.data;
      const mapped = new Set(rdata.map((result) => result.name));
      const choices = Array.from(mapped).slice(0, 25);
      await interaction.respond(
        choices.map((choice) => ({ name: choice, value: choice })),
      );
    } catch {}
  },
  async execute(interaction) {
    const model_name = interaction.options.getString("model");
    const url = `https://api.applio.org/key=${process.env.APPLIO_API_KEY}/models/search?name=${model_name}&type=rvc`;

    let messageIdMap = {};

    if (model_name.length < 3) {
      return interaction.reply({
        content: "The model name must be at least 3 characters long.",
      });
    }

    const loading = await interaction.deferReply();

    try {
      const response = await axios.get(url);
      const data = response.data.slice(0, 25);

      const options = data.map((result, index) => ({
        label: `${result.name}`,
        value: `${index}-${result.id}-${Math.trunc(
          new Date(result.created_at).getTime() / 1000,
        )}`,
        description: `${result.type} · Made by ${result.author_username}`,
        emoji: "<:dot:1134526388456669234>",
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(interaction.user.id)
        .setPlaceholder(`👀 Select a result, found ${data.length} results...`)
        .setOptions(options);

      const firstResult = data[0]; // Get the first result
      const createdDate =
        firstResult.created_at &&
        !isNaN(Math.trunc(new Date(firstResult.created_at).getTime() / 1000))
          ? `<t:${Math.trunc(
              new Date(firstResult.created_at).getTime() / 1000,
            )}:d>`
          : "Unknown";
      const initialEmbed = new EmbedBuilder()
        .setTitle(firstResult.name)
        .setURL(`https://applio.org/models/${firstResult.id}`)
        .setAuthor({
          name: firstResult.author_username,
          url:
            firstResult.author_username &&
            !firstResult.author_username.includes(" ")
              ? `https://applio.org/user/${firstResult.author_username}`
              : undefined,
        })
        .setDescription(
          `- **Uploaded:** ${createdDate}\n` +
            `- **Server:** ${firstResult.server_name}\n` +
            `- **Likes:** ${firstResult.likes}\n` +
            `- **Lang:** ${GetTag(firstResult.tags)}`,
        )
        .setColor("White")
        .setThumbnail(
          firstResult.image_url !== "N/A" ? firstResult.image_url : null,
        )
        .addFields(
          {
            name: "Epochs",
            value: firstResult.epochs || "Unknown",
            inline: true,
          },
          { name: "Technology", value: firstResult.type, inline: true },
          { name: "Algorithm", value: firstResult.algorithm, inline: true },
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      let embedId = `${firstResult.id}`;

      const saveButton = new ButtonBuilder()
        .setLabel("💾 Save")
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`save_button_${firstResult.id}`);

      const downloadButton = new ButtonBuilder()
        .setLabel("📤 Download")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://applio.org/models/download/${firstResult.id}`);

      const likeButton = new ButtonBuilder()
        .setLabel("👍 Like")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://applio.org/models/${firstResult.id}`);

      const botInviteButton = new ButtonBuilder()
        .setLabel("🤖 Bot Invite")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
        );

      const rowButtons = new ActionRowBuilder().addComponents(
        saveButton,
        downloadButton,
        likeButton,
        botInviteButton,
      );

      let new_id = await loading.edit({
        content: `${interaction.user}, I have found ${data.length} results that match your search!`,
        components: [
          rowButtons,
          new ActionRowBuilder().addComponents(selectMenu),
        ],
        embeds: [initialEmbed],
      });

      new_id = await new_id;
      let r = Math.random() * 100;
      if (r < 33) {
        await AdMsg(new_id)
      }
      
      messageIdMap[embedId] = new_id.id;

      const menuCollector = interaction.channel.createMessageComponentCollector(
        {
          componentType: ComponentType.SELECT_MENU,
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000,
        },
      );

      menuCollector.on("collect", async (interaction) => {
        if (
          !interaction.values ||
          /V_D-(\d+)/.test(interaction.values[0]) ||
          interaction.values.length === 0
        ) {
          return;
        }
        menuCollector.resetTimer();
        const selectedModelIndex = parseInt(
          interaction.values[0].split("-")[0],
        );
        const selectedModel = data[selectedModelIndex];
        if (!selectedModel) {
          return;
        }
        const createdDate =
          selectedModel.created_at &&
          !isNaN(
            Math.trunc(new Date(selectedModel.created_at).getTime() / 1000),
          )
            ? `<t:${Math.trunc(
                new Date(selectedModel.created_at).getTime() / 1000,
              )}:d>`
            : "Unknown";
        const embed = new EmbedBuilder()
          .setTitle(selectedModel.name || "No name")
          .setURL(`https://applio.org/models/${selectedModel.id}`)
          .setAuthor({
            name: selectedModel.author_username,
            url:
              selectedModel.author_username &&
              !selectedModel.author_username.includes(" ")
                ? `https://applio.org/user/${selectedModel.author_username}`
                : undefined,
          })
          .setDescription(
            `- **Uploaded:** ${createdDate}\n` +
              `- **Server:** ${selectedModel.server_name}\n` +
              `- **Likes:** ${selectedModel.likes}\n` +
              `- **Lang:** ${GetTag(selectedModel.tags)}`,
          )
          .setColor("White")
          .setThumbnail(
            selectedModel.image_url !== "N/A" ? selectedModel.image_url : null,
          )
          .addFields(
            {
              name: "Epochs",
              value: selectedModel.epochs || "Unknown",
              inline: true,
            },
            { name: "Technology", value: selectedModel.type, inline: true },
            { name: "Algorithm", value: selectedModel.algorithm, inline: true },
          )
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        let embedId = `${selectedModel.id}`;

        const saveButton = new ButtonBuilder()
          .setLabel("💾 Save")
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`save_button_${selectedModel.id}`);

        const downloadButton = new ButtonBuilder()
          .setLabel("📤 Download")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://applio.org/models/download/${selectedModel.id}`);

        const likeButton = new ButtonBuilder()
          .setLabel("👍 Like")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://applio.org/models/${selectedModel.id}`);

        const botInviteButton = new ButtonBuilder()
          .setLabel("🤖 Bot Invite")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
          );

        const rowButtons = new ActionRowBuilder().addComponents(
          saveButton,
          downloadButton,
          likeButton,
          botInviteButton,
        );

        try {
          await interaction.update({
            embeds: [embed],
            components: [
              rowButtons,
              new ActionRowBuilder().addComponents(selectMenu),
            ],
          });
          messageIdMap[embedId] = interaction.message.id;
        } catch {}
      });

      let buttonCollector = interaction.channel.createMessageComponentCollector(
        {
          componentType: ComponentType.Button,
          time: 60000,
        },
      );

      buttonCollector.on("collect", async (interaction) => {
        if (interaction.customId.startsWith("save_button_")) {
          const embedId = interaction.customId.replace("save_button_", "");
          const originalMessageId = messageIdMap[embedId];

          if (originalMessageId) {
            const originalMessage =
              await interaction.channel.messages.fetch(originalMessageId);

            if (originalMessage && originalMessage.embeds.length > 0) {
              buttonCollector.resetTimer();
              const savedEmbed = originalMessage.embeds[0];
              const savedComponents = originalMessage.components;

              try {
                await interaction.user
                  .send({
                    embeds: [savedEmbed],
                    components: savedComponents,
                  })
                  .then(async () => {
                    await interaction.reply({
                      content: `💾 ${interaction.user}, sent you a DM with the model information!`,
                      ephemeral: true,
                    });
                  })
                  .catch(async () => {
                    await interaction.reply({
                      content: `❌ ${interaction.user}, I couldn't send you a DM, make sure you have them enabled.`,
                      ephemeral: true,
                    });
                  });
                delete messageIdMap[embedId];
              } catch {}
            } else {
            }
          } else {
          }
        }
      });
    } catch (error) {
      await loading.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("Oops...")
            .setDescription(
              `Sorry, but I could not find models that match your search "${model_name}"`,
            )
            .setColor("White"),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("🤖 Bot Invite")
              .setStyle(ButtonStyle.Link)
              .setURL(
                `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=${process.env.BOT_PERMS}&scope=bot`,
              ),
            new ButtonBuilder()
              .setLabel("🔍 Search")
              .setStyle(ButtonStyle.Link)
              .setURL(`https://applio.org/models`),
          ),
        ],
      });
    }
  },
};
