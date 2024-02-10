const { REST, Routes } = require("discord.js");
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

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    const globalData = await rest.put(
      Routes.applicationCommands(process.env.BOT_ID),
      {
        body: globalCommands,
      },
    );
    console.log(
      `[COMMAND] Successfully published ${globalData.length} global commands.`,
    );

    const guildData = await rest.put(
      Routes.applicationGuildCommands(
        process.env.BOT_ID,
        process.env.AI_HISPANO_ID,
      ),
      {
        body: guildCommands,
      },
    );
    console.log(
      `[COMMAND] Successfully published ${guildData.length} commands in AI Hispano.`,
    );
  } catch (error) {
    console.error(error);
  }
})();
