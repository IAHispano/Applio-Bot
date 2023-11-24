const {
  AttachmentBuilder,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const util = require("util");
const { getAudioDurationInSeconds } = require("get-audio-duration");

const absolutePath = path.resolve("./");

function deleteAndCreateFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    deleteFolderSync(folderPath);
  }

  fs.mkdirSync(folderPath, { recursive: true });
}

function deleteFolderSync(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file, index) => {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteFolderSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });

    fs.rmdirSync(folderPath);
  }
}

async function deleteFilesByPath(paths) {
  for (const filePath of paths) {
    if (fs.existsSync(filePath)) {
      await fs.promises.rm(filePath, { recursive: true });
    }
  }
}

deleteAndCreateFolder("./audios/input");
deleteAndCreateFolder("./audios/output");
deleteAndCreateFolder("./models");
deleteAndCreateFolder("./zips");

const downloadFile = (url, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(url, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(data);
      await util.promisify(fs.writeFile)(outputPath, buffer);

      resolve();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        console.error("Error downloading the file:", axiosError.message);
      } else {
        console.error("Error downloading the file:", error);
      }
      reject();
    }
  });
};
function runCommand(command) {
  const child = spawn(command, { shell: true });

  child.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}
function fileSizeInMb(fileSizeBytes) {
  return fileSizeBytes / 1048576;
}

async function processAudio(audioURL, modelURL, audioFile, tone) {
  const outputPath = path.join(absolutePath, `/audios/input/${audioFile}`);
  const conversionPath = path.join(absolutePath, `/audios/output/${audioFile}`);
  let start = Date.now();

  try {
    await downloadFile(audioURL, outputPath);

    const duration = await getAudioDurationInSeconds(outputPath);
    const durationLimit = 240;

    if (duration > durationLimit) {
      return {
        success: false,
        message: `The audio **${audioFile}** exceeds the time limit (${duration}s), please upload an audio of less than ${durationLimit}s.`,
        audioFilePath: outputPath,
        resultFilePath: conversionPath,
      };
    }

    const regex =
      /^(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$)/;

    if (!regex.test(audioURL)) {
      return {
        success: false,
        message: "Not link provided.",
        audioFilePath: outputPath,
        resultFilePath: conversionPath,
      };
    }

    const input_path = path.join(outputPath);

    const output_path = path.join(conversionPath);

    const python_script = `"${path.join(absolutePath, "python", "infer.py")}"`;
    const command = `python ${python_script} ${tone} "${input_path}" "${output_path}" "${modelURL}"`;
    try {
      await runCommand(command);

      if (fs.existsSync(conversionPath)) {
        return {
          success: true,
          message: "The file has been converted.",
          audioFilePath: outputPath,
          resultFilePath: conversionPath,
        };
      } else {
        return {
          success: false,
          message: "The file has not been converted.",
          audioFilePath: outputPath,
          resultFilePath: conversionPath,
        };
      }
    } catch (error) {
      console.error("Error running the command:", error);
      return {
        success: false,
        message: "Error converting the file.",
        audioFilePath: outputPath,
        resultFilePath: conversionPath,
      };
    } finally {
      let end = Date.now();
      let elapsed = end - start;
      console.log(`Elapsed time ${elapsed / 1000} seconds.`);
    }
  } catch (error) {
    console.log("Error preparing resources for conversion.");
    console.log(error);
    return {
      success: false,
      message: "Oops, we couldn't download your audio file.",
      audioFilePath: outputPath,
      resultFilePath: conversionPath,
    };
  }
}

class AudioReplyQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  push(modelURL, audioURL, audioFile, tone, interaction) {
    this.queue.push({ modelURL, audioURL, audioFile, tone, interaction });
    const embedQueue = new EmbedBuilder()
      .setTitle("Processing audio...")
      .setDescription(
        `Your file has been added to the queue. You are number #${
          this.length
        } in the queue, please wait until your file is processed.\n\n- **File:** ${audioFile}\n- **Model:** [Discover it here](${modelURL})\n- **Tone:** ${tone}\n- **Estimated time:** ${
          this.length * 4
        } minutes (#${this.length})`
      )
      .setColor("#5865F2")
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    interaction.editReply({
      content: "",
      embeds: [embedQueue],
      ephemeral: true,
    });

    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;

    for (let i = 0; i < this.queue.length; i++) {
      const { modelURL, audioURL, audioFile, tone, interaction } =
        this.queue[i];

      try {
        if (audioFile && modelURL) {
          const result = await processAudio(
            audioURL,
            modelURL,
            audioFile,
            tone
          );

          if (result.resultFilePath) {
            const attachment = new AttachmentBuilder(result.resultFilePath);

            await interaction.followUp({
              content: `${interaction.user}, your audio has been processed and converted successfully!`,
              files: [attachment],
              ephemeral: true,
            });
          } else {
            await interaction.followUp({
              content: result?.message || "Unknown error occurred.",
              ephemeral: true,
            });
          }

          if (result?.audioFilePath) {
            await deleteFilesByPath([
              result?.audioFilePath,
              result?.resultFilePath,
            ]);
          }
        }
      } catch (error) {
        console.log("Error converting the audio:", error);
      }

      this.queue.splice(i, 1);
      i--;
    }

    this.processing = false;
  }

  get length() {
    return this.queue.length;
  }

  clear() {
    this.queue.splice(0, this.queue.length);
  }
}

const audioReplyQueue = new AudioReplyQueue();

module.exports = {
  devOnly: true,
  data: new SlashCommandBuilder()
    .setName("cover")
    .setDescription("RVC » Create a cover with AI easily from Discord!")
    .setDescriptionLocalizations({
      "es-ES": "RVC » Crea un cover con IA fácilmente desde Discord!",
    })
    .addAttachmentOption((option) =>
      option
        .setName("audio")
        .setDescription("Select the audio.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona el audio.",
        })
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setNameLocalizations({ "es-ES": "modelo" })
        .setDescription(
          "Enter the link of the model (Only HuggingFace, make sure it does not have special characters)"
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Ingresa el link del modelo (Sólo HuggingFace, asegúrate de que no tenga caracteres especiales)",
        })
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tone")
        .setNameLocalizations({ "es-ES": "tono" })
        .setDescription("Select the tone.")
        .setDescriptionLocalizations({
          "es-ES": "Selecciona el tono.",
        })
        .addChoices(
          // { name: "High tone", value: "10" },
          { name: "Default tone", value: "0" }
          // { name: "Low tone", value: "-10" }
        )
    ),
  async execute(interaction) {
    const audio = interaction.options.get("audio");
    const audioURL = audio.attachment.url;
    const audioFile = audio?.attachment.name;
    const modelURL = interaction.options.getString("model");
    const tone = interaction.options.getString("tone") || "0";

    const fileSizeMb = fileSizeInMb(audio?.attachment.size);
    if (!modelURL.includes("huggingface")) {
      await interaction.reply({
        content: `The model must be from HuggingFace.`,
        ephemeral: true,
      });
      return;
    }

    if (fileSizeMb > 100) {
      await interaction.reply({
        content: `The audio weighs more than ${sizeLimit}mb.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Loading audio, please wait...",
      ephemeral: true,
    });
    audioReplyQueue.push(modelURL, audioURL, audioFile, tone, interaction);
  },
};
