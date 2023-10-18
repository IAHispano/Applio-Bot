const { REST, Routes } = require("discord.js");
const { clientId, token } = require("./../config.json");
const fs = require("node:fs");
const path = require("node:path");

const globalCommands = [];
const guildCommands = [];
const foldersPath = path.join(__dirname, "../commands/");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      const commandData = command.data.toJSON();
      if (folder === "aihispano") {
        guildCommands.push(commandData);
      } else {
        globalCommands.push(commandData);
      }
    } else {
      console.log(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    const globalData = await rest.put(Routes.applicationCommands(clientId), {
      body: globalCommands,
    });
    console.log(`Successfully published ${globalData.length} global commands.`);

    const guildData = await rest.put(
      Routes.applicationGuildCommands(clientId, "1096877223765606521"),
      {
        body: guildCommands,
      },
    );
    console.log(
      `Successfully published ${guildData.length} commands in AI Hispano.`,
    );
  } catch (error) {
    console.error(error);
  }
})();