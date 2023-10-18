const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Register commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
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
      console.log(`[COMMAND] Loaded command ${command.data.name}`);
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Register events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    console.log(`[EVENT] Loaded once event ${event.name}`);
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}


// Put this in your index.js folder! //

const {DisTube} = require("distube")
const {SpotifyPlugin} = require("@distube/spotify")

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: true, 
    emitAddListWhenCreatingQueue: false, 
    plugins: [new SpotifyPlugin()]
});

const status = queue =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``
client.distube
    .on('playSong', (queue, song) =>
        queue.textChannel.send({
            embeds: [new EmbedBuilder().setColor("Green")
                .setDescription(`🎶 | Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user
                    }\n${status(queue)}`)]
        })
    )
    .on('addSong', (queue, song) =>
        queue.textChannel.send(
            {
                embeds: [new EmbedBuilder().setColor("Green")
                    .setDescription(`🎶 | Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`)]
            }
        )
    )
    .on('addList', (queue, playlist) =>
        queue.textChannel.send(
            {
                embeds: [new EmbedBuilder().setColor("Green")
                    .setDescription(`🎶 | Added \`${playlist.name}\` playlist (${playlist.songs.length
                        } songs) to queue\n${status(queue)}`)]
            }
        )
    )
    .on('error', (channel, e) => {
        if (channel) channel.send(`⛔ | An error encountered: ${e.toString().slice(0, 1974)}`)
        else console.error(e)
    })
    .on('empty', channel => channel.send({
        embeds: [new EmbedBuilder().setColor("Red")
            .setDescription('⛔ |Voice channel is empty! Leaving the channel...')]
    }))
    .on('searchNoResult', (message, query) =>
        message.channel.send(
            {
                embeds: [new EmbedBuilder().setColor("Red")
                    .setDescription('`⛔ | No result found for \`${query}\`!`')]
            })
    )
    .on('finish', queue => queue.textChannel.send({
        embeds: [new EmbedBuilder().setColor("Green")
            .setDescription('🏁 | Queue finished!')]
    }))
    

client.login(token);
