const fs = require("fs");
const { Events } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token } = require("./../config.json");

const rest = new REST().setToken(token);

const fetchUser = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return rest.get(Routes.user(id));
};

function extractAlgorithm(name) {
  const regexPatterns = [
    /\b(Dio|Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
    /\b(Dio|Pm|Harvest|Crepe|Mangio-crepe|Mangio-Crepe|Mangio Crepe|Rmvpe_gpu|Rmvpe gpu|Rvmpe|Rmvpe)\b/gi,
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

function extractEpochsAndAlgorithm(cname,content) {
  cname = cname.replace(/\bRCV\b/g, "RVC");
  cname = cname.replace(/\bRmvpe_gpu\b/g, "Rmvpe");
  cname = cname.replace(/\bRmvpe gpu\b/g, "Rmvpe");
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
  cname = cname.replace(new RegExp(`\\s*\\(${types}\\)|\\s*${types}`, 'gi'), '');
  const typePattern = /\b(RVC(?:\s*V\d+)?|Kits\.AI)\b/ig;
  cname = cname.replace(typePattern, "").trim();
  cname = cname.replace(/\b(RVC(?:\s*V\d+)?|Kits\.AI|\bV\d+\b)\b/gi, "").trim();
  cname = cname.replace(/RVC|Kits\.AI/g, '')
  if (algorithm !== "N/A") {
    cname = cname.replace(new RegExp(`\\b${algorithm}\\b`, 'gi'), ''); 
  }
  const regexPatterns = [
    / - (\d+)(?:\s+Epochs)?/,
    / - (\d+)(?:\s+Epochs)?\)/,  
    /\b(\d+)\s+Epochs\b/,
    /(\d+) Epochs/,
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
    //wihout s
    / - (\d+)(?:\s+Epoch)?/,
    / - (\d+)(?:\s+Epoch)?\)/,  
    / (\d+) Epoch/,
    /\((\d+) Epoch\)/,              
    /\(([^\)]*?(\d+)[^\)]*?)\s*Epoch\)/,
    /(?:\s+\[|\()(\d+)\s+Epoch\)/,
    /\[(\d+)\s*Epoch\]/,
    /(\d+k)\s+Epoch/,
    //---
    /(\d+)\s*Epoch/,
    /(\d+)\s+Epoch/,
    /\(Epoch\s*(\d+)\)/,
    /\bEPOCH (\d+)\b/,
    /\bEPOCH\s*(\d+)\s*\b/,
    /\(EPOCH (\d+)\)/,
    /\(EPOCH\s*(\d+)\s*\)/,
    /\( EPOCH (\d+) \)/,
  ];
  for (const pattern of regexPatterns) {

    const match = cname.match(pattern);
    const match2 = content.match(pattern);
    if (match) {
      epochs = match[1];
      cname = cname.replace(pattern, "");
      cname = cname.replace(/\s*\( Epochs\)/g, ""); 
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, '').trim();
      cname = cname.replace(/(?<![0-9:-])\b(?!\d+ Hop|\d+ Hop|\d+ Steps|\d+ Step\b|\d+'|\d+ \d+\.\d+|\d+\s+|\d+\.\d+\w)-?\d+\b(?![0-9:-])/g, '');
      cname = cname.replace(/\bEpoch\b/g, '');
      cname = cname.replace(/\bepoch\b/g, '');
      cname = cname.replace(/\bepochs\b/g, '');
      cname = cname.replace(/\bepoches\b/g, '');
      break;
    } else if (match2) {   
      epochs = match2[1];
      cname = cname.replace(pattern, "");
      cname = cname.replace(/\s*\( Epochs\)/g, ""); 
      cname = cname.replace(/(\s+-\s+\d+\s+Epochs)?$/, '').trim();
      cname = cname.replace(/(?<![0-9:-])\b(?!\d+ Hop|\d+ Hop|\d+ Steps|\d+ Step\b|\d+'|\d+ \d+\.\d+|\d+\s+|\d+\.\d+\w)-?\d+\b(?![0-9:-])/g, '');
      cname = cname.replace(/\bEpoch\b/g, '');
      cname = cname.replace(/\bepoch\b/g, '');
      cname = cname.replace(/\bepochs\b/g, '');
      cname = cname.replace(/\bepoches\b/g, '');
      break;
    }
  }

  cname = cname.replace(/\(\s*,\s*\)/g, '');
  cname = cname.replace(/\/+/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)/g, "");
  cname = cname.replace(/\s*\(\s*\)|\s*\(\s*\)/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)|\s*\(\s*\)|\s*\[\s*\]|\s*\[\s*\]/g, "").trim();
  cname = cname.replace(/\s*\(\s*\)/g, "");
  cname = cname.replace(/,\s*,\s*\d+\s*Steps/g, "").trim();
  cname = cname.replace(/\(\s*,\s*\d+\s*Steps\)/g, "").trim(); 
  cname = cname.replace(/\(\)/g, "").trim(); 
  cname = cname.replace(/\(\s*,\s*,\s*\)/g, "");
  cname = cname.replace(/\[\s*\|\s*\]/g, '');
  cname = cname.replace(/\[\s*,\s*\]/g, '');
  cname = cname.replace(/\{\s*\}/g, "");
  cname = cname.replace(/\[\s*\)/g, "");
  cname = cname.replace(/,+/g, ',');
  cname = cname.replace(/, ,/g, '')
  cname = cname.replace(/(?<=\s)-(?=\s)/g, '');
  cname = cname.replace(/ -+$/g, '');
  cname = cname.replace(/,\s*$/, '');
  cname = cname.replace(/\(\{\s*\}\)/g, '');
  cname = cname.replace(/\(\s*\.\s*\)/g, '');
  cname = cname.replace(/\[\s*,\s*\]/g, '');
  cname = cname.replace(/\(\s*\+\s*\)/g, '');
  cname = cname.replace(/\s+/g, ' ');
  cname = cname.replace(/(?<=\S)\\+(?=\s|$)/g, '');
  cname = cname.replace(/\[\|\|\]/g, '');

  return { cname, epochs, algorithm, types };
}

function findOwner(content, item) {
  content = content.replace(/\*\*/g, '');
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

      const starterMessage = await fetchedThread.fetchStarterMessage();
      if (!starterMessage.content.match(/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g)) {
        const messages = await fetchedThread.messages.fetch();
        let foundContent = false;
        let messageContent = "";
        for (const message of messages.values()) {
            if (message.author.id === starterMessage.author.id && message.content && message.content.match(/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g)) { 
              messageContent += message.content + "\n";
              foundContent = true;
          }
        }
        if (foundContent) {
            starterMessage.content += "\n" + messageContent;
        } else {
            starterMessage.content = starterMessage.content ? starterMessage.content : "";
        }
      }

      const threadLink =
      (starterMessage && starterMessage.content) ?
      starterMessage.content.match(new RegExp("(https?://[^\\s]+)", "ig")) || "N/A" :
      "N/A";
    
      const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
        fetchedThread.name,
        starterMessage.content
      );
      
      let owner = findOwner(starterMessage.content, fetchedThread.ownerId);
      const username = await fetchUser(owner);

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
