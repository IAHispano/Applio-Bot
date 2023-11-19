const {
  AttachmentBuilder,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const axios = require("axios");
const util = require("util");
const { getAudioDurationInSeconds } = require("get-audio-duration");

const absolutePath = path.resolve("./");

async function deleteFilesInFolder(folderPath) {
  try {
    const folderExists = await fs.promises
      .access(folderPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!folderExists) {
      await fs.promises.mkdir(folderPath, { recursive: true });
      return;
    }

    const files = await fs.promises.readdir(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error(`Error deleting files in folder ${folderPath}: ${error}`);
  }
}

deleteFilesInFolder("./audios/input");
deleteFilesInFolder("./audios/output");

async function runCommand(command) {
  try {
    const { stdout, stderr } = await exec1(command);
    if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      console.log(stdout);
    }
  } catch (error) {
    console.log(`error: ${error}`);
  }
}
function getModelsList(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const modelsList = [];
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      modelsList.push({
        name: file,
        value: file,
      });
    }
  }
  return modelsList;
}

const modelsList = getModelsList("./models");

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

const searchFileWithPrefix = (folderPath, prefix, startsWith) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      const matchingFile = files.find((file) =>
        startsWith ? file.startsWith(prefix) : file.endsWith(prefix),
      );
      resolve(matchingFile ? path.join(folderPath, matchingFile) : null);
    });
  });
};

const exec1 = util.promisify(exec);

async function runCommand(command) {
  try {
    const { stdout, stderr } = await exec1(command);
    if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      console.log(stdout);
    }
  } catch (error) {
    console.log(`error: ${error}`);
  }
}

function fileSizeInMb(fileSizeBytes) {
  return fileSizeBytes / 1048576;
}

async function processAudio(url, songName, modelname) {
  const outputPath = path.join(absolutePath, `/audios/input/${songName}`);
  const conversionPath = path.join(absolutePath, `/audios/output/${songName}`);
  let start = Date.now();

  try {
    await downloadFile(url, outputPath);

    const duration = await getAudioDurationInSeconds(outputPath);
    const durationLimit = 560;

    if (duration > durationLimit) {
      return {
        success: false,
        message: `The audio **${songName}** exceeds the time limit (${duration}s), please upload an audio of less than ${durationLimit}s.`,
        audioFilePath: outputPath,
        resultFilePath: conversionPath,
      };
    }
    const model_folder = path.join(absolutePath, "models", modelname);

    const index_file = await searchFileWithPrefix(model_folder, "added_", true);
    const weight_file = await searchFileWithPrefix(model_folder, ".pth", false);

    if (!index_file || !weight_file) {
      return {
        success: false,
        message: "Error finding model files.",
        audioFilePath: outputPath,
        resultFilePath: conversionPath,
      };
    }

    const input_path = path.join(outputPath);
    const index_path = path.join(index_file);
    const opt_path = path.join(conversionPath);
    const model_path = path.join(weight_file);

    const python_script = `"${path.join(absolutePath, "python", "infer.py")}"`;
    const command = `python ${python_script} 0 "${input_path}" "${index_path}" rmvpe "${opt_path}" "${model_path}" 0.66 cpu True 3 0 1 0.33`;
    try {
      await runCommand(command);
      console.log("Audio processed successfully!");

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
  } catch (err) {
    console.log("Error preparing resources for conversion.");
    console.log(err);
    return {
      success: false,
      message: "Oops, we couldn't download your audio file.",
      audioFilePath: outputPath,
      resultFilePath: conversionPath,
    };
  }
}

async function deleteFilesByPath(paths) {
  for (const filePath of paths) {
    if (fs.existsSync(filePath)) {
      await fs.promises.rm(filePath, { recursive: true });
    }
  }
}

class AudioReplyQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  push(url, songName, modelName, interaction) {
    this.queue.push({ url, songName, modelName, interaction });
    const embedCola = new EmbedBuilder()
      .setTitle("Added to the queue!")
      .setDescription(
        `${interaction.user} your file has been added to the queue.\nYou are number #${this.length}, please wait.`,
      )
      .setColor("#5865F2")
      .setTimestamp();

    interaction.editReply({ content: "", embeds: [embedCola] });

    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;

    for (let i = 0; i < this.queue.length; i++) {
      const { url, songName, modelName, interaction } = this.queue[i];

      try {
        if (url && songName && modelName) {
          const result = await processAudio(url, songName, modelName);

          if (result && result.success && result.resultFilePath) {
            const attachment = new AttachmentBuilder(result.resultFilePath);

            await interaction.channel?.send({
              content: `${interaction.user}, your audio has been processed and converted successfully!`,
              files: [attachment],
            });
          } else {
            await interaction.followUp({
              content: result?.message || "Unknown error occurred.",
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
        console.log("Error converting the audio: ", error);
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
    .setDescription("Create a cover with AI easily from Discord!")
    .addAttachmentOption((option) =>
      option
        .setName("audio")
        .setDescription("Select the audio you want to convert.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setDescription("Select the model you want to use.")
        .addChoices(...modelsList)
        .setRequired(true),
    ),
  async execute(interaction) {
    const audio = interaction.options.get("audio");
    const audioURL = audio?.attachment?.url ? audio.attachment.url : null;
    const model = interaction.options.get("model");

    if (audio && audio.attachment && audioURL && model && model.value) {
      const modelName = model.value.toString();
      const sizeLimit = 50;

      const fileSizeMb = fileSizeInMb(audio?.attachment.size);

      if (fileSizeMb > sizeLimit) {
        await interaction.editReply({
          content: `The audio weighs more than ${sizeLimit}mb.`,
        });
        return;
      }

      await interaction.reply({
        content: "Loading audio...",
        ephemeral: false,
      });
      audioReplyQueue.push(
        audioURL,
        audio.attachment.name,
        modelName,
        interaction,
      );
    }
  },
};
