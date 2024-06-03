const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

async function GetCdnDsc(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.7",
      },
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error("El tipo de contenido no es una imagen.");
    }

    const folder = path.resolve("./cdndsc");
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const filename = path.parse(url).base;
    const filePath = path.join(folder, filename);

    const fileContent = await response.buffer();
    await writeFile(filePath, fileContent);

    return filePath;
  } catch (error) {
    throw error;
  }
}

module.exports = { GetCdnDsc };
