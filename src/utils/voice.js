const fs = require("fs");
const path = require("path");
const langdetect = require("langdetect");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

async function createVideoFromAudioAndWaveform(audioFilePath, videoFilePath) {
	return new Promise((resolve, reject) => {
		ffmpeg()
			.input(audioFilePath)
			.complexFilter([
				"[0:a]showwaves=s=800x200:mode=point:colors=white,format=yuv420p[v]",
			])
			.outputOptions("-map [v]")
			.outputOptions("-map 0:a")
			.outputOptions("-c:v libx264") // Video codec
			.outputOptions("-c:a aac") // Audio codec
			.outputOptions("-shortest") // Stop when the shortest stream ends
			.outputOptions("-y") // Overwrite output files without asking
			.output(videoFilePath)
			.outputOption(`-metadata`, `artist="Applio"`)
			.outputOption(`-metadata`, `title="Hello Applio"`)
			.outputOption(`-metadata`, `album_artist="AI Hispano"`)

			.on("end", () => {
				console.log("Video created");
				resolve();
			})
			.on("error", (err) => {
				console.error("Error creating video:", err.message);
				reject(err);
			})
			.run();
	});
}

async function getAudioAnswer(prompt) {
	try {
		const detectedLanguage = langdetect.detect(prompt);

		const voices = {
			en: "en-US-AndrewNeural",
			es: "es-ES-AlvaroNeural",
			// TODO: Add more languages
			fr: "fr-FR-DeniseNeural",
			de: "de-DE-ConradNeural",
		};

		const selectedVoice = voices[detectedLanguage] || voices["en"];

		const tts = new MsEdgeTTS();
		await tts.setMetadata(
			selectedVoice,
			OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
		);

		const audioFilePath = "./audio.mp3";
		await tts.toFile(audioFilePath, prompt);

		const videoFilePath = "./video.mp4";
		await createVideoFromAudioAndWaveform(audioFilePath, videoFilePath);

		return videoFilePath;
	} catch (error) {
		console.error("Error generating audio answer:", error);
		throw error;
	}
}

module.exports = { getAudioAnswer };
