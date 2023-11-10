const fs = require("fs");
const { Events } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token } = require("../../../config.json");

const rest = new REST().setToken(token);

const fetchUser = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return rest.get(Routes.user(id));
};

function extractAlgorithm(name) {
  const regexPatterns = [
    /\b(Dio|Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rvmpe|Rmvpe|Rmvpe_gpu)\b/gi,
    /\b(Dio|Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rvmpe|Rmvpe|Rmvpe_gpu)\b/gi,
    /\b(dio|pm|harvest|crepe|mangio-crepe|rmv?pe)\b/gi,
  ];

  for (const pattern of regexPatterns) {
    const matches = name.match(pattern);
    if (matches) {
      const algorithm = matches[0].replace(
        /^(.)(.*)$/,
        (match, firstChar, restChars) =>
          firstChar.toUpperCase() + restChars.toLowerCase()
      );

      if (algorithm.toLowerCase() === "rvmpe") {
        name = name.replace(/\brvmpe\b/gi, "Rmvpe");
        return algorithm;
      }

      name = name.replace(matches[0], algorithm);
      return algorithm;
    }
  }

  for (const pattern of regexPatterns) {
    const matches = name.match(pattern);
    if (matches) {
      const algorithm = matches[0].replace(
        /^(.)(.*)$/,
        (match, firstChar, restChars) =>
          firstChar.toUpperCase() + restChars.toLowerCase()
      );

      if (algorithm.toLowerCase() === "rvmpe") {
        name = name.replace(/\brvmpe\b/gi, "Rmvpe");
        return algorithm;
      }

      name = name.replace(matches[0], algorithm);
      return algorithm;
    }
  }

  return "N/A";
}

function extractEpochsAndAlgorithm(cname) {
  let epochs = "N/A";
  let algorithm = extractAlgorithm(cname);
  let types = null;
  const typeKeywords = ["RVC", "Kits.AI"];
  for (const keyword of typeKeywords) {
    if (cname.toLowerCase().includes(keyword.toLowerCase())) {
      types = keyword;
      break;
    }
  }
  cname = cname.replace(/\bRCV\b/g, "RVC");

  const typePattern = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/gi;
  cname = cname.replace(typePattern, "").trim();
  cname = cname.replace(/\b(RVC(?:\s*V\d+)?|Kits\.AI|\bV\d+\b)\b/gi, "").trim();
  cname = cname.replace(/RVC|Kits\.AI/g, "");
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
    /(\d+)\s*(?:k\s*)?Epochs?/i,
    /\(EPOCHS (\d+)\)/,
    /\(EPOCHS\s*(\d+)\s*\)/,
    /\( EPOCH (\d+) \)/,
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
    /\(EPOCH (\d+)\)/,
    /\(EPOCH\s*(\d+)\s*\)/,
    /\( EPOCH (\d+) \)/,
  ];
  for (const pattern of regexPatterns) {
    const match = cname.match(pattern);
    if (match) {
      epochs = match[1];
      cname = cname.replace(pattern, "");
      cname = cname.replace(/\s*\( Epochs\)/g, "");
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, "").trim();
      cname = cname.replace(/(?<![0-9:-])-?\d+(?![0-9:-])/g, "");
      cname = cname.replace(/\s*\d+k(?![a-z])/g, "");
      cname = cname.replace(/\bepochs\b/g, "");

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
  cname = cname.replace(/\(\s*,\s*\d+\s*Steps\)/g, "").trim();
  cname = cname.replace(/\(\)/g, "").trim();
  cname = cname.replace(/\(\s*,\s*,\s*\)/g, "");
  cname = cname.replace(/\[\s*\|\s*\]/g, "");
  cname = cname.replace(/\[\s*,\s*\]/g, "");
  cname = cname.replace(/\{\s*\}/g, "");
  cname = cname.replace(/,+/g, ",");
  cname = cname.replace(/, ,/g, "");
  cname = cname.replace(/(?<=\s)-(?=\s)/g, "");
  cname = cname.replace(/ -+$/g, "");
  cname = cname.replace(/,\s*$/, "");
  cname = cname.replace(/\(\{\s*\}\)/g, "()");
  cname = cname.replace(/\(\s*\.\s*\)/g, "");
  cname = cname.replace(/\s+/g, " ");
  cname = cname.replace(/(?<=\S)\\+(?=\s|$)/g, "");

  return { cname, epochs, algorithm, types };
}

module.exports = {
  name: Events.ThreadCreate,

  async execute(thread) {
    try {
      const threadsChannels = [
        "1159289700490694666", // AI Hub
        "1124570199018967075", // AI Hub Polska
        "1101148158819573790", // AI Hispano

        "1172562944563871856", // Testing
      ];

      if (!threadsChannels.includes(thread.parentId)) return;

      const fetchedThread = await thread.fetch();

      const appliedTags = fetchedThread.appliedTags.map((tagId) => {
        const tag = fetchedThread.guild.roles.cache.get(tagId);
        return tag ? tag.name : `${tagId}`;
      });

      const messages = await thread.messages.fetch();
      const starterMessage = messages.first() || "N/A";

      const threadLink =
      (starterMessage && starterMessage.content) ?
      starterMessage.content.match(new RegExp("(https?://[^\\s]+)", "ig")) || "N/A" :
      "N/A";
    
      const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
        fetchedThread.name
      );
      const username = await fetchUser(fetchedThread.ownerId);

      const threadData = {
        id: fetchedThread.id,
        name: fetchedThread.name,
        owner: fetchedThread.ownerId,
        owner_username: username.username,
        upload: fetchedThread.createdAt,
        server: fetchedThread.guild.id,
        tags: appliedTags,
        content: starterMessage.content,
        attachment: [starterMessage.attachments.first()],
        context: {
          Name: cname || "N/A",
          Type: types || "N/A",
          Algorithm: algorithm || "N/A",
          Epoch: epochs || "N/A",
          Link: threadLink || "N/A",
          Server: fetchedThread.guild.name,
        },
      };

      const jsonData = JSON.stringify(threadData, null, 2);

      const modelsFolderPath = "./models";
      if (!fs.existsSync(modelsFolderPath)) {
        fs.mkdirSync(modelsFolderPath);
      }

      const filePath = `${modelsFolderPath}/${fetchedThread.id}.json`;
      fs.writeFileSync(filePath, jsonData);
    } catch (error) {
      console.error("Error fetching thread:", error);
    }
  },
};
