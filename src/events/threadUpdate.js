const {
	EmbedBuilder,
	Events,
	ButtonBuilder,
	ActionRowBuilder,
} = require("discord.js");
const { JsonThread, FormatThread, uuid } = require("../utils/savesystem.js");
const { createClient } = require("@supabase/supabase-js");
const client = require("../bot.js");

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_TOKEN,
);

async function VerifyModel(author_id, link_) {
	const link = link_.replace(/\?download=true/, "");
	const { data, error } = await supabase
		.from("models")
		.select("*")
		.ilike("link", `%${link}%`)
		.order("created_at", { ascending: false })
		.range(0, 14);

	if (error || !data || data.length === 0) {
		return { Result: "Not Found" };
	}

	for (const item of data) {
		if (item.author_id === author_id && item.link === link) {
			return { Result: "Founded", ModelID: item.id };
		} else if (item.link === link && item.author_id !== author_id) {
			return { Result: "Steal", AuthorID: item.author_id };
		}
	}

	return { Result: "Not Found" };
}

async function fetchThreadWithRetries(channel, maxRetries = 10) {
	let thread;
	for (let i = 0; i < maxRetries; i++) {
		try {
			thread = await channel.fetch();
			const starterMessage = await thread.fetchStarterMessage();
			if (starterMessage?.content) return { thread, starterMessage };
		} catch {
			console.log(`Retry ${i + 1} to fetch thread ${channel.id}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}
	throw new Error(`Failed to fetch thread ${channel.id}`);
}

async function logEmbed(embed, row, steal) {
	try {
		await client.shard.broadcastEval(
			(c, context) => {
				const [embed, row, logChannelId, steal] = context;
				const channel = c.channels.cache.get(logChannelId);
				if (channel) {
					channel.send({
						content: steal ? `<@989772388508000306>` : undefined,
						embeds: [embed],
						components: [row],
					});
				}
			},
			{
				context: [
					embed,
					row,
					process.env.LOG_CHANNEL_ID,
					steal !== false ? steal : null,
				],
			},
		);
	} catch (error) {
		console.error("Error logging embed:", error);
	}
}

module.exports = {
	name: Events.ThreadUpdate,
	once: false,
	async execute(oldThread, newThread) {
		const threadsChannels = [
			"1159289700490694666",
			"1124570199018967075",
			"1101148158819573790",
			"1175430844685484042",
			"1166322928195997756",
			"1287048820768903250",
			"1124524797804675172",
			"1116802604710760518",
			"1128748527271559209",
			"1160799273546416188",
			"1124566634456174605",
			"1159260121998827560",
			"1096877223765606521",
			"1124470937442603119",
			"1105916908928237688",
			"989772840792371320",
		];

		try {
			if (!threadsChannels.includes(newThread.parentId)) return;

			const { thread: fetchedThread, starterMessage: test } =
				await fetchThreadWithRetries(newThread);

			const threadNameLower = fetchedThread.name.toLowerCase();
			if (
				["gptsovits", "gpt-sovits", "vits"].some((str) =>
					threadNameLower.includes(str),
				)
			) {
				return;
			}

			const urlRegex = /\bhttp\b/gi;
			const zipRegex = /\.zip\b/gi;
			const driveRegex = /\bdrive\.google\.com\b/gi;
			const shouldSave =
				(test.content.match(urlRegex) && test.content.match(zipRegex)) ||
				test.content.match(driveRegex);

			const { contentToSave, result: jsonData } = await JsonThread(
				fetchedThread,
				test,
				"aihub",
				shouldSave,
			);
			if (!contentToSave || !jsonData) return;

			const ignoredOwners = [
				"1150230843214794822",
				"1175478584752750715",
				"1175436185179521128",
				"1175436031705751644",
				"1137921689133514793",
				"1184615269793013780",
			];
			const ignoredServers = ["929985620984602665"];

			if (
				ignoredOwners.includes(jsonData.owner) ||
				ignoredServers.includes(jsonData.server) ||
				(test.author.bot && jsonData.owner !== process.env.BOT_ID)
			) {
				return;
			}

			const FormatResult = await FormatThread(jsonData);
			if (FormatResult.Status === "Failed") return;

			const verify = await VerifyModel(
				FormatResult.Data.owner,
				FormatResult.Data.context.Link,
			);
			if (verify.Result === "Founded") {
				return;
			}
			const Steal = verify.Result === "Steal" ? verify.AuthorID : false;

			const dataToUpload = {
				id: FormatResult.Data.id,
				id_: uuid(FormatResult.Data.id),
				name: FormatResult.Data.context.Name,
				link: FormatResult.Data.context.Link,
				image_url: verify.Image || "N/A",
				type: "RVC",
				epochs: FormatResult.Data.context.Epoch,
				created_at: FormatResult.Data.upload,
				algorithm: FormatResult.Data.context.Algorithm,
				author_id: FormatResult.Data.owner,
				author_username: FormatResult.Data.owner_username,
				server_id: FormatResult.Data.server,
				server_name: FormatResult.Data.server_name,
				tags: FormatResult.Data.context.Tags.join(","),
			};

			const { error } = await supabase
				.from("models")
				.update(dataToUpload)
				.eq("id", jsonData.id);

			if (error) {
				console.error("Error updating data:", error.message);
			} else {
				console.log("Data updated correctly");
			}

			const embed = new EmbedBuilder()
				.setTitle(`${FormatResult.Data.context.Name}`)
				.addFields(
					{
						name: "Server",
						value: `${FormatResult.Data.server} (${FormatResult.Data.server_name})`,
						inline: true,
					},
					{
						name: "Upload",
						value: new Date(FormatResult.Data.upload).toLocaleString(),
						inline: true,
					},
					{
						name: "Model Creator",
						value: `[@${FormatResult.Data.owner_username}](https://discordapp.com/users/${FormatResult.Data.owner}) (<@${FormatResult.Data.owner}>)`,
						inline: true,
					},
					{
						name: "Algorithm",
						value: `${FormatResult.Data.context.Algorithm}`,
						inline: true,
					},
					{
						name: "Tags",
						value:
							FormatResult.Data.context.Tags.length > 0
								? FormatResult.Data.context.Tags.join(", ")
								: "None",
						inline: false,
					},
				)
				.setImage(
					FormatResult.Image !== "N/A"
						? FormatResult.Image
						: "https://github.com/IAHispano/Applio-Website/blob/main/public/no_bg_applio_logo.png?raw=true",
				)
				.setFooter({ text: `Updated ${FormatResult.Data.id}` });

			const threadButton = new ButtonBuilder()
				.setStyle(5)
				.setURL(
					`https://discord.com/channels/${fetchedThread.guild.id}/${test.channel.id}`,
				)
				.setLabel("Go to Model")
				.setEmoji("↗");

			const linkButton = new ButtonBuilder()
				.setStyle(5)
				.setURL(`${FormatResult.Data.context.Link}`)
				.setLabel("Link Model")
				.setEmoji("🪓");

			const row = new ActionRowBuilder().addComponents(
				threadButton,
				linkButton,
			);

			await logEmbed(embed, row, Steal);
		} catch (error) {
			console.error("Error processing message update:", error);
		}
	},
};
