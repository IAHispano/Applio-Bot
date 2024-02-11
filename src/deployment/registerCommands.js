const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");
const ProgressBar = require("progress");
const client = require("../bot.js");

client.commands = new Collection();
const foldersPath = path.join(__dirname, "../commands");
const commandFolders = fs.readdirSync(foldersPath);

const totalCommands = commandFolders.reduce((acc, folder) => {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  return acc + commandFiles.length;
}, 0);

const bar = new ProgressBar(
  "[COMMAND] [:bar] :current/:total (:percent) - :commandName",
  { total: totalCommands },
);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      bar.tick({ commandName: command.data.name });
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}
