const fs = require("fs");
const { Events } = require("discord.js");
const { extractAlgorithm, extractEpochsAndAlgorithm, findOwner, enviarMensajeConArchivo, tagsMapping, youtubeImage } = require("../utils/main.js")
const { createClient }= require('@supabase/supabase-js');
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST().setToken(process.env.BOT_TOKEN);

const fetchUser = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit protection
  const user = await rest.get(Routes.user(id));
  return user;
};

// Create a single supabase client for interacting with your database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_TOKEN)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
module.exports = {
  name: Events.ThreadCreate,
  once: false,
  async execute(thread) {
    try {
      const threadsChannels = [
          "1159289700490694666",
          "1124570199018967075", 
          "1101148158819573790", 
          "1175430844685484042",
          "1160799273546416188",
          "1166322928195997756",
          "1184575112784134225",
          "1124524797804675172",
          "1116802604710760518",
          "1128748527271559209",
        ];
  
      if (!threadsChannels.includes(thread.parentId)) return;

      option = "aihub"
      let fetchedThread = await thread.fetch();
      console.log(fetchedThread.name, fetchedThread.id)
      sleep(5000)
      fetchedThread = await thread.fetch().catch(async error => { fetchedThread = await thread.fetch() });

      let test     
      try {
        test = await fetchedThread.fetchStarterMessage()
      } catch {
        for (let i = 0; i < 15; i++) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          try {
            // Esperar 5 segundos
           fetchedThread = await thread.fetch();
           test = await fetchedThread.fetchStarterMessage();
           if (test && test.content) break;
          } catch {
            console.log("Failed Message First", fetchedThread.id);
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      }
      let hasAttachments = false
      if (test && typeof test.attachments !== 'undefined') {
        hasAttachments = test.attachments.size > 0;
      }
      
      
      let foundContent = false;
      let messageContent = "";
      if (!hasAttachments || !test.content.match(/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g)  || !fetchedThread.name.toLowerCase().includes("epoch")) {
          const messages = await fetchedThread.messages.fetch();

          for (const message of messages.values()) {
              if(test.id === message.id) continue;
              _ = extractAlgorithm(message.content);

              const isAihispanoOrTestAuthor = option === "aihispano" || message.author.id === test.author.id;
              const hasValidContent = message.content && (message.content.match(/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g) || message.content.match(/\bhttps?:\/\/\S+?\.(?:jpg|jpeg|png|gif|bmp|svg|webp)\b\S*/g));

              if (isAihispanoOrTestAuthor && hasValidContent) {
                  messageContent += " " + message.content + "\n";
                  if (message.attachments.size > 0) {
                      test.attachments = test.attachments.concat(message.attachments)
                  }
                  foundContent = true;
              } else if (isAihispanoOrTestAuthor && !(messageContent === "") && !(_ === "N/A") && !(message.content.match(/https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud|media\.discordapp\.net\/attachments)\b)(?![^\s]+\.(?:jpg|jpeg|png|gif|jpeg|bmp|svg|webp)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g))) {
                  messageContent += " " + message.content + "\n";
                  if (message.attachments.size > 0) {
                      test.attachments = test.attachments.concat(message.attachments)
                  }
                  foundContent = true;
              } else if(isAihispanoOrTestAuthor && message.content.includes("epochs")) {
                  messageContent += " " + message.content + "\n";
                  if (message.attachments.size > 0) {
                      test.attachments = test.attachments.concat(message.attachments)
                  }
                  foundContent = true;
              } else if(isAihispanoOrTestAuthor && message.attachments.size > 0) {
                  messageContent += " " + message.content + "\n";
                  if (message.attachments.size > 0) {
                      test.attachments = test.attachments.concat(message.attachments)
                  }
                  foundContent = true;
              }
          }
          if (foundContent) {
              test.content += messageContent;
          } else {
              // Not Found
              test.content = test.content ? test.content : "";
          }
      }
      

      const result = {
          id: fetchedThread.id,
          name: fetchedThread.name,
          owner: fetchedThread.ownerId,
          server: fetchedThread.guild.id,
          server_name: fetchedThread.guild.name,
          published: fetchedThread.createdTimestamp,
          upload: fetchedThread.createdAt,
          tags: fetchedThread.appliedTags,
          content: test ? test.content : null,
          attachments: test.attachments,
      };

      const jsonData = result;
      const content = jsonData.content
      const modelsFolderPath = "./models";
      if (!require("fs").existsSync(modelsFolderPath)) {
        require("fs").mkdirSync(modelsFolderPath);
      }

      const filePath = `${modelsFolderPath}/${fetchedThread.id}.json`;
      var urlRegex = /\bhttp\b/gi;
      var zipRegex = /\.zip\b/gi;
      var driveRegex = /\bdrive\.google\.com\b/gi
      const savesecureURL = content.match(urlRegex);
      const savesecureZIP = content.match(zipRegex);
      const savesecureDrive = content.match(driveRegex);
      if ((savesecureURL && savesecureZIP) || savesecureDrive) {
          require("fs").writeFileSync(filePath, JSON.stringify(result, null, 2));
      }

      const { cname, epochs, algorithm, types } = extractEpochsAndAlgorithm(
        jsonData.name,
        jsonData.tags,
        jsonData.content
      );
      
      let xtypes = types

      const currentTags = jsonData.tags;
      const updatedTags = [];
  
      for (const tagKey in currentTags) {
        const tagID = currentTags[tagKey];
        let updatedTagNames = [];
      
        for (const tagName in tagsMapping.Tags) {
          if (tagsMapping.Tags[tagName].includes(parseInt(tagID, 10))) {
            updatedTagNames.push(tagName);
            break;
          }
        }
      
        const updatedTagsString = updatedTagNames.filter(tag => tag !== "").join(",");
        if (updatedTagsString) {
          updatedTags.push(updatedTagsString);
        }
      }
  
      for (const tagKey in currentTags) {
        const tagID = currentTags[tagKey];
        let updatedTagNames = [];
      
        for (const tagName in tagsMapping.Lang) {
          if (tagsMapping.Lang[tagName].includes(parseInt(tagID, 10))) {
            updatedTagNames.push(tagName);
            break;
          }
        }
      
        const updatedTagsString = updatedTagNames.filter(tag => tag !== "").join(",");
        if (updatedTagsString) {
          updatedTags.push(updatedTagsString);
        }
      }

      let image = "N/A";
      let data_attachment = jsonData.attachments && jsonData.attachments[0] !== null ? jsonData.attachments : (jsonData.attachment && jsonData.attachment[0] !== null ? jsonData.attachment : null);
      
      if (data_attachment) {
        const imageExtensions = [".png", ".jpeg", ".jpg", ".webp", ".gif", ".bmp", ".tiff"]; // Lista de extensiones de imágenes
        const imageAttachment = data_attachment.find(attachment => 
          (attachment.contentType && attachment.contentType.startsWith('image/')) || 
          (attachment.type && attachment.type.startsWith('image/'))
        );
        if (imageAttachment) {
          image = imageAttachment.url;
          
        } else {
        }
      }
  
      const regex = /https?:\/\/(?!.*(?:youtu\.be|youtube|soundcloud)\b)[^\s]+|(?:huggingface\.co|app\.kits\.ai|mega\.nz|drive\.google\.com|pixeldrain\.com)\/[^\s]+|[a-zA-Z0-9.-]+\/[\w.%-]+\.zip/g
      let contentn = content.replace(/<|>|\|\|/g, '')
      contentn = contentn.replace(/\.zip\)/g, '.zip')
      contentn = contentn.replace(/\|/g, ' ');
      contentn = contentn.replace(/\*/g, ' ');
      const links = contentn.match(regex);
      
  
      const supportedSites = {
        "huggingface.co": [],
        "app.kits.ai": [],
        "mega.nz": [],
        "drive.google.com": [],
        "pixeldrain.com": [],
        "mediafire.com": [],
        "workupload.com": [],
        "cdn.discordapp.com": [],
        "ko-fi.com/s/": [],
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
          } else if (link.includes("mediafire.com")) {
            site = "mediafire.com";
          } else if (link.includes("workupload.com")) {
            site = "workupload.com";
          } else if (link.includes("cdn.discordapp.com") && link.includes(".zip")) {
            site = "cdn.discordapp.com";
          } else if (link.includes("ko-fi.com/s/")) {
            site = "ko-fi.com/s/";
          }
  
          if (site) {
            supportedSites[site].push(link);
  
            if (site !== "app.kits.ai" && types === "N/A") {
              xtypes = "RVC";
            } else if (site === "app.kits.ai" && types === "N/A") {
              xtypes = "Kits.AI";
            }
            
            
          } else {
            //console.log(link, jsonData.id)
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
  
      let reorganizedSupportedSites = [];
  
      if (hasLinks) {
        
        for (const site in supportedSites) {
          for (const link of supportedSites[site]) {
            // Realiza una solicitud HTTP para obtener el tamaño del archivo
            try {
              reorganizedSupportedSites.push({
                Cloud: site,
                Link: link,
              });
            } catch (error) {
              console.error(`Error al obtener el tamaño de ${link}: ${error.message}`);
            }
          }
        }
        
      }
  
      if (!reorganizedSupportedSites || reorganizedSupportedSites.length === 0) return;
  
      const seenLinks = {}; 
  
      for (const { Cloud: site, Link: link } of reorganizedSupportedSites) {
        const index = reorganizedSupportedSites.findIndex(item => item.Link === link); 
        if (!seenLinks[link]) {
          seenLinks[link] = true;
        } else {
          reorganizedSupportedSites.splice(index, 1);
        }
      }
  
      reorganizedSupportedSites = reorganizedSupportedSites.filter(item => item.Link);
  
      const updatedContext = {
        Name: cname,
        Type: xtypes !== "N/A" ? xtypes : types,
        Algorithm: algorithm,
        Epoch: epochs,
        Tags: updatedTags,
        Link: reorganizedSupportedSites[0].Link || None,
      };
      jsonData.links = reorganizedSupportedSites
      jsonData.context = updatedContext;
  
      

      let owner = "N/A";
      if (jsonData.owner) {
        owner = findOwner(jsonData.content, jsonData.owner);
        jsonData.owner = owner
        user = await fetchUser(jsonData.owner);
        jsonData.owner_username = user.username;
      }

      require("fs").writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

      const dataToUpload = {
        id: jsonData.id,
        name: jsonData.context.Name,
        link: reorganizedSupportedSites[0].Link,
        image_url: image,
        type: "RVC",
        epochs: epochs,
        created_at: jsonData.upload,
        algorithm: algorithm,
        author_id: owner,
        author_username: jsonData.owner_username,
      };
  
      const { error } = await supabase
        .from('models')
        .upsert([dataToUpload]);
  
      if (error) {
        return console.log(error.message);
      }
  
      return console.log("Data uploaded correctly");

    } catch (error) {
      console.error("Error fetching thread:", error);
    }
  },
};
