const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");

async function GetPixiv(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error("Network response was not ok");
		const body = await response.text();
		const $ = cheerio.load(body);
		const urlParts = url.split("/");
		const id = urlParts[urlParts.length - 1];
		const preloadDataContent = $("#meta-preload-data").attr("content");
		const preloadData = JSON.parse(preloadDataContent);
		let originalImageUrl = preloadData.illust[id]?.urls?.original;
		if (!originalImageUrl) {
			const regex = new RegExp(
				`{"id":"${id}","title":".*?","illustType":\\d+,"xRestrict":\\d+,"restrict":\\d+,"sl":4,"url":"(.*?)"`,
				"g",
			);
			const imageDataMatch = body.match(regex);
			if (imageDataMatch && imageDataMatch.length > 0) {
				const firstMatch = imageDataMatch[0];
				const urlMatch = firstMatch.match(/"url":"(.*?)"/);
				if (urlMatch && urlMatch[1]) {
					originalImageUrl = urlMatch[1]
						.replace(/\/c\/.*?\/custom-thumb\//, "/img-original/")
						.replace(/\/c\/.*?\/img-master\//, "/img-original/")
						.replace(/\/img-master\//, "/img-original/")
						.replace("_custom1200.jpg", ".png")
						.replace("_square1200.jpg", ".jpg");
				}
			}
		}
		const imageResponse = await fetch(originalImageUrl, {
			headers: {
				accept:
					"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
				"accept-language": "es-ES,es;q=0.9",
				"sec-ch-ua":
					'"Not_A Brand";v="8", "Chromium";v="120", "Opera GX";v="106"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "image",
				"sec-fetch-mode": "no-cors",
				"sec-fetch-site": "cross-site",
				Referer: "https://www.pixiv.net/",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
		});
		if (!imageResponse.ok) throw new Error("Network response was not ok");
		const folder = path.resolve("./pixiv");
		if (!fs.existsSync(folder)) {
			await fs.mkdir(folder, { recursive: true });
		}
		const dest = fs.createWriteStream(path.join(folder, `${id}.png`));
		imageResponse.body.pipe(dest);
		await new Promise((resolve, reject) => {
			dest.on("finish", resolve);
			dest.on("error", reject);
		});
		return path.join(folder, `${id}.png`);
	} catch (error) {
		throw error;
	}
}
module.exports = { GetPixiv };
