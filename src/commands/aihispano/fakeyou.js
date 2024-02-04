const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
  } = require("discord.js");
  const axios = require("axios");
  const { client_id } = require("../../config.json");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("fakeyou")
      .setNameLocalizations({
        "es-ES": "fakeyou",
      })
      .setDescription("Fakeyou » Search any voice model in Fakeyou.")
      .setDescriptionLocalizations({
        "es-ES":
          "Fakeyou » Busca cualquier modelo de voz en Fakeyou.",
      })
      .addStringOption((option) =>
        option
          .setName("model")
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
  
    async execute(interaction) {
      const model = interaction.options.getString("model");
      if (model.length <= 2) {
        const embed = new EmbedBuilder()
          .setDescription("Please enter a model name with at least 2 characters.")
          .setColor("Red");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
  
      const loadingMessage = await interaction.deferReply();
  
      try {
  
        const response = await axios.get("https://api.fakeyou.com/tts/list");
        let data = response.data.models || [];
        data = data.filter(modelo =>
            modelo.title.toLowerCase().includes(model.toLowerCase())
        );
  
        const pageSize = 1;
        let currentPage = 1;
        let mainEmbed;
        let mainButtons;
        let messageIdMap = {};
        let selectedResult;
  
        const options = data.slice(0, 25).map((result, index) => ({
          label: `${result.title}`,
          value: `${index + 1}-${result.model_token}-${result.created_at}`,
          description: `${result.tts_model_type} · Made by ${result.creator_username}`,
          emoji: "<:dot:1134526388456669234>",
        }));
  
        async function displayPage(page) {
          const startIdx = (page - 1) * pageSize;
          const endIdx = Math.min(startIdx + pageSize, data.length);
  
          

  
          const embed = new EmbedBuilder()
  
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setColor("White")
            .setTimestamp();
  
          for (let i = startIdx; i < endIdx; i++) {
            const result = data[i];
            selectedResult = data[i];
            if (!result) continue;
  
            const uploadedTimestamp =
              typeof result.created_at === "string"
                ? Date.parse(result.created_at) / 1000
                : typeof result.created_at === "number"
                ? result.created_at / 1000
                : NaN;
            const uploadedText = isNaN(uploadedTimestamp)
              ? "N/A"
              : `<t:${Math.floor(uploadedTimestamp)}:R>`;
  
            embed.setDescription(
              `**Owner:** ${result.creator_username}\n**Uploaded:** ${uploadedText}`,
            );
  
            const fields = [
              {
                name: "Technology",
                value: `${result.tts_model_type}`,
                inline: true,
              },
            ];

            embed.addFields(fields);
        
        }


  
          let embedId = `${selectedResult.model_token}`
  
          const saveButton = new ButtonBuilder()
            .setLabel("💾 Save")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`save_fake_${selectedResult.model_token}`);
  
          const menu = new StringSelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder(`🔎 ${data.length} models found...`)
            .setOptions(options);
  
          if (data.length === 1) {
            menu.setDisabled(true);
          }
  
          const row_menu = new ActionRowBuilder().addComponents(menu);
  
          const row_buttons = new ActionRowBuilder().addComponents(
            saveButton,
          );
          mainEmbed = embed;
          mainButtons = row_buttons;
          let new_id = loadingMessage.edit({
            content: `I have found ${data.length} results for the search ${model}...`,
            embeds: [embed],
            components: [row_menu, row_buttons],
          });
          new_id = await new_id;
          messageIdMap[embedId] = new_id.id;
        }
  
        displayPage(currentPage);
  
        let menuCollector = interaction.channel.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (i) =>
            i.user.id === interaction.user.id &&
            i.customId === interaction.user.id,
        });
  
        menuCollector.on("collect", async (interaction) => {
          const selectedResult = data.find(
            (result) =>
              `${data.indexOf(result) + 1}-${result.model_token}-${result.created_at}` ===
              interaction.values[0],
          );
  
          if (selectedResult) {
  
            const embed = new EmbedBuilder()
              .setTitle(selectedResult.title)
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setColor("White")
              .setTimestamp();
  
            const uploadedTimestamp =
              typeof selectedResult.created_at === "string"
                ? Date.parse(selectedResult.created_at) / 1000
                : typeof selectedResult.created_at === "number"
                ? selectedResult.created_at / 1000
                : NaN;
            const uploadedText = isNaN(uploadedTimestamp)
              ? "N/A"
              : `<t:${Math.floor(uploadedTimestamp)}:R>`;
  
            embed.setDescription(
              `**Owner:** ${selectedResult.creator_username}\n**Uploaded:** ${uploadedText}`,
            );
  
            const fields = [
              {
                name: "Technology",
                value: `${selectedResult.tts_model_type}`,
                inline: true,
              },
            ];

            embed.addFields(fields);
  

  
            let embedId = `${selectedResult.model_token}`
  
            const saveButton = new ButtonBuilder()
              .setLabel("💾 Save")
              .setStyle(ButtonStyle.Primary)
              .setCustomId(`save_fake_${selectedResult.model_token}`);
  
            const row_buttons = new ActionRowBuilder().addComponents(
              saveButton,
            );
  
            const menu = new StringSelectMenuBuilder()
              .setCustomId(interaction.user.id)
              .setPlaceholder(`🔎 ${data.length} models found...`)
              .setOptions(options);
  
            const row_menu = new ActionRowBuilder().addComponents(menu);
            mainEmbed = embed;
            mainButtons = row_buttons;
            interaction.update({
              embeds: [embed],
              components: [row_menu, row_buttons],
            });
  
            messageIdMap[embedId] = interaction.message.id;
          }
        });
  
        let buttonCollector = interaction.channel.createMessageComponentCollector(
          {
            componentType: ComponentType.Button,
          },
        );
  
        buttonCollector.on("collect", async (interaction) => {
          if (interaction.customId.startsWith("save_fake_")) {
            const embedId = interaction.customId.replace("save_fake_", "");
            const originalMessageId = messageIdMap[embedId];
  
            if (originalMessageId) {
  
              const originalMessage = await interaction.channel.messages.fetch(
                originalMessageId,
              );
    
  
              if (originalMessage && originalMessage.embeds.length > 0) {
                const savedEmbed = originalMessage.embeds[0];
                const savedComponents = originalMessage.components;
  
                interaction.user
                .send({
                  embeds: [savedEmbed],
                  components: savedComponents,
                })
                .then(() => {
                  interaction.reply({
                    content: `💾 ${interaction.user}, sent you a DM with the model information!`,
                    ephemeral: true,
                  })
                })
                .catch(() => {
                  interaction.reply({
                    content: `❌ ${interaction.user}, I couldn't send you a DM, make sure you have them enabled.`,
                    ephemeral: true,
                  });
                });
                delete messageIdMap[embedId];
              } else {
              }
            } else {
            }
          }
        });
        buttonCollector.on("end", async (collected, reason) => {
  
          for (const embedId in messageIdMap) {
            const originalMessageId = messageIdMap[embedId];
            if (originalMessageId) {
              try {
                
                const originalMessage = await interaction.channel.messages.fetch(
                  originalMessageId
                )
        
                if (originalMessage && originalMessage.components.length > 0) {
         
                  delete messageIdMap[embedId];
                }
              } catch (error) {
                console.log("");
              }
            }
          }
        });
      } catch (error) {
        console.log(error);
        const embed = new EmbedBuilder()
          .setDescription(`No results found for the search ${model}...`)
          .setColor("Red")
          .setFooter({
            text: `Powered by Applio — Make sure you spelled it correctly!`,
          });
        await loadingMessage.edit({
          embeds: [embed],
          content: null,
        });
      }
    },
  };