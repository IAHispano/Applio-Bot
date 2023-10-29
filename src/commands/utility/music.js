const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");

// Mapa para almacenar la información de reproducción de música por servidor
const musicDataMap = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setNameLocalizations({
      "es-ES": "música",
    })
    .setDescription("Utility » Enjoy listening to music from a voice channel!")
    .setDescriptionLocalizations({
      "es-ES": "Utility » ¡Disfruta escuchando música desde un canal de voz!",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setNameLocalizations({
          "es-ES": "reproducir",
        })
        .setDescription("Start playing a song.")
        .setDescriptionLocalizations({
          "es-ES": "Comienza a reproducir una canción.",
        })
        .addStringOption((option) =>
          option
            .setName("song")
            .setNameLocalizations({
              "es-ES": "canción",
            })
            .setDescription("Song you want to play.")
            .setDescriptionLocalizations({
              "es-ES": "Canción que quieres reproducir.",
            })
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setNameLocalizations({
          "es-ES": "detener",
        })
        .setDescription("Stop playing music.")
        .setDescriptionLocalizations({
          "es-ES": "Deja de reproducir música.",
        })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("skip")
        .setNameLocalizations({
          "es-ES": "saltar",
        })
        .setDescription("Skip the current song.")
        .setDescriptionLocalizations({
          "es-ES": "Salta la canción actual.",
        })
    )
    .setDMPermission(false),
  async execute(interaction) {
    
    const voiceChannel = await interaction.member.voice.channel;
    const subcommand = interaction.options.getSubcommand();

    if (!voiceChannel) {
      return interaction.reply(
        "You need to be in a voice channel to use this command!"
      );
    }

    if (subcommand === "play") {
      const guildId = interaction.guild.id;
      const musicData = getOrCreateMusicData(guildId);

      const song = interaction.options.getString("song");
      const ytInfo = await play.search(song, { limit: 1 });
      const videoUrl = ytInfo[0].url;
      const duration = ytInfo[0].durationInSec;
      const thumbnail = ytInfo[0].thumbnails[0].url;
      const requestedBy = interaction.user.username;
      const playlistItem = {
        videoUrl,
        duration,
        thumbnail,
        requestedBy,
      };
      musicData.playlist.push(playlistItem);

      if (!musicData.isPlaying && musicData.playlist.length === 1) {
        musicData.isPlaying = true;
        interaction.reply("Song added to queue!");
        await playNextSong(voiceChannel, interaction, guildId);
      } else {
        const embed = createPlaylistEmbed(musicData.playlist);

        if (musicData.playlistMessage) {
          await editPlaylistMessage(interaction, embed, guildId);
        } else {
          await sendPlaylistMessage(interaction, embed, guildId);
        }
      }
    } else if (subcommand === "stop") {
      const guildId = interaction.guild.id;
      const musicData = getOrCreateMusicData(guildId);

      if (!musicData.isPlaying) {
        return interaction.reply("No songs playing.");
      }

      musicData.playlist.length = 0;
      musicData.isPlaying = false;
      musicData.playlistMessage = null;

      if (musicData.connection) {
        musicData.connection.destroy();
        musicData.connection = null;
      }

      interaction.reply("Stopped reproduction.");
    } else if (subcommand === "skip") {
      const guildId = interaction.guild.id;
      const musicData = getOrCreateMusicData(guildId);

      if (!musicData.isPlaying) {
        return interaction.reply("There are no songs playing.");
      }

      if (musicData.playlist.length === 0) {
        return interaction.reply("There are no more songs in the queue.");
      }

      interaction.reply("Song skipped.");

      if (musicData.connection) {
        musicData.connection.destroy();
        musicData.connection = null;
      }

      playNextSong(voiceChannel, interaction, guildId);
    }
  },
};

async function playNextSong(voiceChannel, interaction, guildId) {
  const musicData = getOrCreateMusicData(guildId);
  const nextSong = musicData.playlist.shift();

  if (nextSong) {
    musicData.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const ytInfo = await play.search(nextSong.videoUrl, { limit: 1 });
    const videoUrl = ytInfo[0].url;
    const duration = ytInfo[0].durationInSec;
    const thumbnail = ytInfo[0].thumbnails[0].url;
    const requestedBy = nextSong.requestedBy;
    const stream = await play.stream(nextSong.videoUrl);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    player.play(resource);
    musicData.connection.subscribe(player);

    const embed = createNowPlayingEmbed(
      ytInfo[0],
      videoUrl,
      duration,
      thumbnail,
      requestedBy,
      interaction
    );

    interaction.channel.send({ embeds: [embed] });

    player.on("idle", () => {
      if (musicData.playlist.length === 0) {
        musicData.isPlaying = false;
        musicData.playlistMessage = null;
        player.stop();

        if (musicData.connection) {
          musicData.connection.destroy();
          musicData.connection = null;
        }

        return;
      }

      playNextSong(voiceChannel, interaction, guildId);
    });
  }
}

function createNowPlayingEmbed(
  ytInfo,
  videoUrl,
  duration,
  thumbnail,
  requestedBy,
  interaction
) {
  const embed = new EmbedBuilder()
    .setTitle(ytInfo.title)

    .addFields(
      { name: "Duration", value: formatDuration(duration), inline: true },
      { name: "Streams", value: formatNumber(ytInfo.views), inline: true },
      { name: "Artist", value: ytInfo.channel.name, inline: true }
    )
    .setThumbnail(thumbnail)
    .setColor("Blurple")
    .setTimestamp()
    .setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

  return embed;
}

function createPlaylistEmbed(playlist) {
  const embed = new EmbedBuilder()
    .setTitle("Song queue")
    .setThumbnail(playlist[0].thumbnail)
    .setColor("Blurple")
    .setTimestamp()
    .setFooter({
      text: `There are a total of ${playlist.length} songs in queue.`,
    });

  playlist.forEach((song, index) => {
    embed.addFields({
      name: `> ${index + 1} » ${song.videoUrl}`,
      value: `Requested by ${song.requestedBy}`,
    });
  });

  return embed;
}

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function editPlaylistMessage(interaction, embed) {
  await interaction.reply({ embeds: [embed] });
}

async function sendPlaylistMessage(interaction, embed, guildId) {
  const musicData = getOrCreateMusicData(guildId);
  const reply = await interaction.reply({ embeds: [embed] });
  musicData.playlistMessage = reply.id;
}

function getOrCreateMusicData(guildId) {
  if (!musicDataMap.has(guildId)) {
    musicDataMap.set(guildId, {
      playlist: [],
      isPlaying: false,
      playlistMessage: null,
      connection: null,
    });
  }

  return musicDataMap.get(guildId);
}