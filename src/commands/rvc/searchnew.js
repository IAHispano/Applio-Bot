const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { clientId, bot_perms, dataDirectories } = require("../../config.json");
const fs = require("fs");
const path = require("path");
function findOwner(content, item) {
  content = content.replace(/\*\*/g, "");
  const regexPatterns = [
    /By: <@(\d+)>/i,
    /Author: <@(\d+)>/i,
    /Author <@(\d+)>/i,
    /By <@(\d+)>/,
    /By <@(\d+)>/i,
    /creado por <@(\d+)>/i,
    /creado por <@(\d+)>/,
    /por <@(\d+)>/i,
    /por <@(\d+)>/,
  ];

  for (const pattern of regexPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return item;
}
function extractType(content) {
  const typePattern1 = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi; // Regex original
  const typePattern2 = /\b(?:RVC\s*)?(V[12]|Kits\.AI)\b/gi; // Nuevo regex

  const matches1 = content.match(typePattern1);
  if (matches1) {
    return matches1.join(", ");
  }

  const matches2 = content.match(typePattern2);
  if (matches2) {
    return matches2.join(", ");
  }

  return "N/A";
}
function extractAlgorithm(content) {
  const regexPatterns = [
    /\b(Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rvmpe|Rmvpe)\b/gi,
    /\b(Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rvmpe|Rmvpe)\b/gi,
    /\b(pm|harvest|crepe|mangio-crepe|rmv?pe)\b/gi,
  ];

  for (const pattern of regexPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      const algorithm = matches[0].replace(
        /^(.)(.*)$/,
        (match, firstChar, restChars) =>
          firstChar.toUpperCase() + restChars.toLowerCase()
      );

      if (algorithm.toLowerCase() === "rvmpe") {
        content = content.replace(/\brvmpe\b/gi, "Rmvpe");
        return algorithm;
      }

      content = content.replace(matches[0], algorithm);
      return algorithm;
    }
  }

  return "N/A";
}
function extractEpochsAndAlgorithm(cname) {
  let epochs = "N/A";
  let algorithm = extractAlgorithm(cname);
  let types = extractType(cname);

  const typePattern = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi;
  cname = cname.replace(typePattern, "").trim();
  cname = cname.replace(/\b(RVC(?:\s*V\d+)?|Kits\.AI|\bV\d+\b)\b/gi, "").trim();
  if (algorithm !== "N/A") {
    cname = cname.replace(new RegExp(`\\b${algorithm}\\b`, "gi"), "");
  }

  const regexPatterns = [
    / - (\d+)(?:\s+Epochs)?/,
    / - (\d+)(?:\s+Epochs)?\)/,
    / (\d+) Epochs/,
    /\((\d+) Epochs\)/,
    /\(([^\)]*?(\d+)[^\)]*?)\s*Epochs\)/,
    /(?:\s+\[|\()(\d+)\s+Epochs\)/,
    /\[(\d+)\s*Epochs\]/,
    /(\d+k)\s+Epochs/,
    / - (\d+)(?:\s+Epoch)?/,
    / - (\d+)(?:\s+Epoch)?\)/,
    / (\d+) Epoch/,
    /\((\d+) Epoch\)/,
    /\(([^\)]*?(\d+)[^\)]*?)\s*Epoch\)/,
    /(?:\s+\[|\()(\d+)\s+Epoch\)/,
    /\[(\d+)\s*Epoch\]/,
    /(\d+k)\s+Epoch/,
    /(\d+)\s*Epoch/,
    /(\d+)\s+Epoch/,
    /(\d+)\s*(?:k\s*)?Epochs?/i,
  ];
  for (const pattern of regexPatterns) {
    const match = cname.match(pattern);
    if (match) {
      epochs = match[1];
      cname = cname.replace(pattern, "");
      cname = cname.replace(/\s*\( Epochs\)/g, "");
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, "").trim();
      cname = cname.replace(/\d+/g, "");
      cname = cname.replace(/\s*\d+k\s*/g, "");

      break;
    }
  }

  cname = cname.replace(/\(\s*,\s*\)/g, "");
  cname = cname.replace(/\/+/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)/g, "");
  cname = cname.replace(/\s*\(\s*\)|\s*\(\s*\)/g, "").trim();
  cname = cname
    .replace(/\s*\(\s*\)|\s*\(\s*\)|\s*\[\s*\]|\s*\[\s*\]/g, "")
    .trim();
  cname = cname.replace(/\s*\(\s*\)/g, "");
  cname = cname.replace(/,\s*,\s*\d+\s*Steps/g, "").trim();
  cname = cname.replace(/\(\s*,\s*\d+\s*Steps\)/g, "").trim(); // Eliminar "(,, 9400 Steps)"
  cname = cname.replace(/\(\)/g, "").trim(); // Eliminar cualquier otro "(,)" restante
  cname = cname.replace(/\(\s*,\s*,\s*\)/g, "");
  cname = cname.replace(/\[\s*\|\s*\]/g, "");
  cname = cname.replace(/\[\s*,\s*\]/g, "");
  cname = cname.replace(/\{\s*\}/g, "");
  cname = cname.replace(/,+/g, ",");
  cname = cname.replace(/, ,/g, "");
  cname = cname.replace(/(?<=\s)-(?=\s)/g, "");
  cname = cname.replace(/ -+$/g, "");
  cname = cname.replace(/,\s*$/, "");

  return { cname, epochs, algorithm, types };
}
function generateLinkDescription(supportedSites) {
  const descriptions = [];

  for (const site in supportedSites) {
    if (supportedSites.hasOwnProperty(site)) {
      const links = supportedSites[site];

      const linkDescriptions = links.map(
        (link) => `[${site}](${link.split(">")[0]})`
      );
      descriptions.push(...linkDescriptions);
    }
  }

  return descriptions.length > 0 ? descriptions.join(", ") : "N/A";
}

function searchSimilarities(searchedName, data) {
  const results = [];

  data.forEach((item) => {
    if (item.name && item.content) {
      const name = item.name;
      const content = item.content;

      if (
        typeof name === "string" &&
        name.toLowerCase().includes(searchedName.toLowerCase())
      ) {
        const regex = /(https?:\/\/[^\s]+)/g;
        const links = content.match(regex);
        const owner = findOwner(content, item.owner);
        const tagsMapping = {
          // AI Hispano
          "1127715413640364132": "🇯🇵",
          "1110874643155406878": "🇺🇸",
          "1127715243569721484": "🇰🇷",
          "1127722904612778095": "🇲🇽",
          "1110874219362914425": "🇪🇸",
          // AI Hub (NEW)
          "1159339312018624513": "🇺🇸",
          "1159339353198317628": "🇪🇸",
          "1159339390657646602": "🇯🇵",
          "1159339410022744074": "🇰🇷",
          "1160153969935519804": "🇷🇺",
          "1162032086526459915": "🇮🇹",
          // AI Hub (OLD)
          "1110364355700199464": "🇺🇸",
          // AI Hub BR
          "1124525427747197019": "🇧🇷",
          "1124525391101575308": "🇺🇸",
          "1124525717762363422": "🇯🇵",
        };
        const itemTags = item.tags
          .map((tag) => tagsMapping[tag] || null)
          .filter((tag) => tag !== null);
        const displayedTags = itemTags.length > 0 ? itemTags : ["🇺🇸❓"];
        const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
          item.name
        );
        let sample = "N/A";
        let image = "N/A";
        if (item.attachments) {
          const audioAttachment = item.attachments.find(
            (attachment) =>
              attachment.contentType &&
              attachment.contentType.startsWith("audio/")
          );
          if (audioAttachment) {
            sample = audioAttachment.url;
          }
          const imageExtensions = [
            ".png",
            ".jpeg",
            ".jpg",
            ".webp",
            ".gif",
            ".bmp",
            ".tiff",
          ]; // Lista de extensiones de imágenes
          const imageAttachment = item.attachments.find(
            (attachment) =>
              (attachment.contentType &&
                attachment.contentType.startsWith("image/")) ||
              (attachment.type && attachment.type.startsWith("image/"))
          );
          if (imageAttachment) {
            image = imageAttachment.url;
          } else {
            // Intenta encontrar enlaces de imágenes en el contenido
            const contentUrls = content.match(
              new RegExp("(https?://[^\\s]+)", "ig")
            );
            if (contentUrls) {
              for (const url of contentUrls) {
                for (const extension of imageExtensions) {
                  if (url.endsWith(extension)) {
                    image = url;
                    break;
                  }
                }
                if (image) {
                  break;
                }
              }
            }

            if (!imageAttachment) {
              image = "N/A";
            }
          }
        }

        const supportedSites = {
          "huggingface.co": [],
          "app.kits.ai": [],
          "mega.nz": [],
          "drive.google.com": [],
          "pixeldrain.com": [],
        };
        if (links && links.length > 0) {
          for (const link of links) {
            let site = ""; // Por defecto, categorizamos como "otros"

            if (link.includes("huggingface.co")) {
              site = "huggingface.co";
            } else if (link.includes("app.kits.ai")) {
              site = "app.kits.ai";
            } else if (link.includes("mega.nz")) {
              site = "mega.nz";
            } else if (link.includes("drive.google.com")) {
              site = "drive.google.com";
            } else if (link.includes("pixeldrain.com")) {
              site = "pixeldrain.com";
            }

            if (site) {
              supportedSites[site].push(link);
            }
          }
        }
        let hasLinks = false;
        for (const site in supportedSites) {
          if (supportedSites[site].length > 0) {
            hasLinks = true;
            break;
          }
        }
        if (hasLinks) {
          results.push({
            name: cname,
            owner: owner,
            link: supportedSites,
            epoch: epochs,
            algorithm: algorithm,
            type: types,
            tags: displayedTags,
            uploadDate: item.upload
              ? new Date(item.upload).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
              : "N/A",
            attachments: image,
            sample: sample,
          });
        }
      }
    } else if (item.name && item.media) {
      const name = item.name;
      if (
        typeof name === "string" &&
        name.toLowerCase().includes(searchedName.toLowerCase())
      ) {
        let sample = "N/A";
        let image = "N/A";
        if (item.media) {
          const audioAttachment = item.media.find(
            (attachment) =>
              attachment.type && attachment.type.startsWith("audio/")
          );
          if (audioAttachment) {
            sample = audioAttachment.url;
          }
          const imageExtensions = [
            ".png",
            ".jpeg",
            ".jpg",
            ".webp",
            ".gif",
            ".bmp",
            ".tiff",
          ]; // Lista de extensiones de imágenes
          const imageAttachment = item.media.find(
            (attachment) =>
              (attachment.contentType &&
                attachment.contentType.startsWith("image/")) ||
              (attachment.type && attachment.type.startsWith("image/"))
          );
          if (imageAttachment) {
            image = imageAttachment.url;
          }
        }
        const links = item.links;
        const supportedSites = {
          "huggingface.co": [],
          "app.kits.ai": [],
          "mega.nz": [],
          "drive.google.com": [],
          "pixeldrain.com": [],
        };

        if (links && links.length > 0) {
          for (const link of links) {
            let site = ""; // Por defecto, categorizamos como "otros"

            if (link.Link.includes("huggingface.co")) {
              site = "huggingface.co";
            } else if (link.Link.includes("app.kits.ai")) {
              site = "app.kits.ai";
            } else if (link.Link.includes("mega.nz")) {
              site = "mega.nz";
            } else if (link.Link.includes("drive.google.com")) {
              site = "drive.google.com";
            } else if (link.Link.includes("pixeldrain.com")) {
              site = "pixeldrain.com";
            }

            if (site) {
              supportedSites[site].push(link.Link);
            }
          }
        }

        let hasLinks = false;
        for (const site in supportedSites) {
          if (supportedSites[site].length > 0) {
            hasLinks = true;
            break;
          }
        }

        if (hasLinks) {
          results.push({
            name: name,
            owner: item.owner,
            link: supportedSites,
            epoch:
              item.epoch !== undefined && item.epoch !== null
                ? item.epoch
                : "N/A",
            algorithm:
              item.algorithm !== undefined && item.algorithm !== null
                ? item.algorithm
                : "N/A",
            type:
              item.type !== undefined && item.type !== null ? item.type : "N/A",
            tags: item.tags.length > 0 ? item.tags : ["🇺🇸❓"],
            uploadDate: item.upload
              ? new Date(item.upload).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
              : "N/A",
            attachments: image,
            sample: sample,
          });
        }
      }
    }
  });
  return results;
}
function loadDataFromDirectory(directory) {
  const data = [];
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    if (path.extname(file) === ".json") {
      const content = fs.readFileSync(path.join(directory, file), "utf8");
      data.push(JSON.parse(content));
    }
  });

  return data;
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
        .setNameLocalizations({
          "es-ES": "modelo",
        })
        .setDescription("Enter the name of the model you wish to search for.")
        .setDescriptionLocalizations({
          "es-ES": "Ingrese el nombre del modelo que desea buscar.",
        })
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    const model = interaction.options.getString("model");

    if (!model) {
      await interaction.reply("Please provide the model name.");
      return;
    }

    const data = [];
    dataDirectories.forEach((directory) => {
      data.push(...loadDataFromDirectory(directory));
    });
    console.log("Data: ", data.length);

    const results = searchSimilarities(model, data);

    if (results.length === 0) {
      const embed = new EmbedBuilder()
        .setDescription(`No results found for the search ${model}...`)
        .setColor("#5865F2")
        .setFooter({
          text: `Powered by Applio — Make sure you spelled it correctly!`,
        });
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const pageSize = 1;
    const totalPages = results.length;
    let currentPage = 1;

    const options = results.slice(0, 25).map((result, index) => {
      const maxNameLength = 55; // Establece la longitud máxima deseada para el nombre
      const slicedName =
        result.name.length > maxNameLength
          ? `${result.name.slice(0, maxNameLength)}...`
          : result.name;

      return {
        label: `${slicedName} (${result.algorithm} - ${result.epoch} Epochs)`,
        value: `${slicedName}-${result.owner} [${index}]`,
        emoji: "<:dot:1134526388456669234>",
      };
    });

    const displayPage = (page) => {
      const startIdx = (page - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, results.length);

      const sampleAudioButton = new ButtonBuilder()
        .setLabel("🎙️ Sample Audio")
        .setStyle(ButtonStyle.Link);

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor("#5865F2")
        .setTimestamp();

      for (let i = startIdx; i < endIdx; i++) {
        const result = results[i];
        if (!result) continue;
        const linkDescription = generateLinkDescription(result.link);

        const fields = [
          {
            name: "Epochs",
            value: `${result.epoch}`,
            inline: true,
          },
          {
            name: "Technology",
            value: `${result.type}`,
            inline: true,
          },
          {
            name: "Algorithm",
            value: `${result.algorithm}`,
            inline: true,
          },
          {
            name: "Uploaded",
            value: `${result.uploadDate}`,
            inline: true,
          },
          {
            name: "Author",
            value: `[Click to view](https://discordapp.com/users/${result.owner})`,
            inline: true,
          },
          {
            name: "Tags",
            value: result.tags.join("\n"),
            inline: true,
          },
          {
            name: "Download",
            value: linkDescription,
            inline: true,
          },
        ];
        if (result.attachments !== "N/A") {
          embed.setImage(result.attachments);
        }

        const audioAttachment = result.sample;
        if (audioAttachment !== "N/A") {
          sampleAudioButton.setURL(
            `https://audioplayer-play.w3spaces.com/saved-from-Tryit-2023-10-24.html?link=${audioAttachment}`
          );
        } else {
          sampleAudioButton.setURL(
            `https://audioplayer-play.w3spaces.com/saved-from-Tryit-2023-10-24.html?link=`
          );
          sampleAudioButton.setDisabled(true);
        }

        embed.setTitle(result.name);
        embed.addFields(fields);
      }

      const botInviteButton = new ButtonBuilder()
        .setLabel("🤖 Bot Invite")
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`
        )
        .setStyle(ButtonStyle.Link);

      const menu = new StringSelectMenuBuilder()
        .setCustomId("models")
        .setPlaceholder(`🔎 ${results.length} models found...`)
        .setOptions(options);

      if (results.length === 1) {
        menu.setDisabled(true);
      }

      const row_menu = new ActionRowBuilder().addComponents(menu);

      const row_buttons = new ActionRowBuilder().addComponents(
        sampleAudioButton,
        botInviteButton
      );

      interaction.reply({
        embeds: [embed],
        components: [row_menu, row_buttons],
      });
    };

    displayPage(currentPage);

    let collector;

    collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
    });

    collector.on("collect", async (interaction) => {
      const selectedResult = results.find((result, index) => {
        const maxNameLength = 55; // Establece la longitud máxima deseada para el nombre
        const slicedName =
          result.name.length > maxNameLength
            ? `${result.name.slice(0, maxNameLength)}...`
            : result.name;

        return (
          `${slicedName}-${result.owner} [${index}]` === interaction.values[0]
        );
      });

      if (selectedResult) {
        const sampleAudioButton = new ButtonBuilder()
          .setLabel("🎙️ Sample Audio")
          .setStyle(ButtonStyle.Link);
        const linkDescription = generateLinkDescription(selectedResult.link);

        const embed = new EmbedBuilder()
          .setTitle(selectedResult.name)
          .setColor("#5865F2")
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor("#5865F2")
          .setTimestamp();

        const fields = [
          {
            name: "Epochs",
            value: `${selectedResult.epoch}`,
            inline: true,
          },
          {
            name: "Technology",
            value: `${selectedResult.type}`,
            inline: true,
          },
          {
            name: "Algorithm",
            value: `${selectedResult.algorithm}`,
            inline: true,
          },
          {
            name: "Uploaded",
            value: `${selectedResult.uploadDate}`,
            inline: true,
          },
          {
            name: "Author",
            value: `[Click to view](https://discordapp.com/users/${selectedResult.owner})`,
            inline: true,
          },
          {
            name: "Tags",
            value: selectedResult.tags.join("\n"),
            inline: true,
          },
          {
            name: "Link",
            value: linkDescription,
            inline: true,
          },
        ];

        if (selectedResult.attachments !== "N/A") {
          embed.setImage(selectedResult.attachments);
        }

        const audioAttachment = selectedResult.sample;
        if (audioAttachment !== "N/A") {
          sampleAudioButton.setURL(
            `https://audioplayer-play.w3spaces.com/saved-from-Tryit-2023-10-24.html?link=${audioAttachment}`
          );
        } else {
          sampleAudioButton.setDisabled(true);
          sampleAudioButton.setURL(
            `https://audioplayer-play.w3spaces.com/saved-from-Tryit-2023-10-24.html?link=`
          );
        }
        embed.addFields(fields);

        const botInviteButton = new ButtonBuilder()
          .setLabel("🤖 Bot Invite")
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${bot_perms}&scope=bot`
          )
          .setStyle(ButtonStyle.Link);
        const row_buttons = new ActionRowBuilder().addComponents(
          sampleAudioButton,
          botInviteButton
        );

        const menu = new StringSelectMenuBuilder()
          .setCustomId("models")
          .setPlaceholder(`🔎 ${results.length} models found...`)
          .setOptions(options);

        const row_menu = new ActionRowBuilder().addComponents(menu);

        interaction.update({
          embeds: [embed],
          components: [row_menu, row_buttons],
        });
      }
    });
  },
};
