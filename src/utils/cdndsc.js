const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs'); // Utilizamos fs.promises para evitar el uso de callbacks
const path = require('path');

async function GetCdnDsc(url) {
    try {
        const imageResponse = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/",
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            },
            method: "GET",
          });
          if (!imageResponse.ok) {
            throw new Error('Network response was not ok');
          }
          const contentType = imageResponse.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('El tipo de contenido no es una imagen.');
          }          
          const folder = path.resolve("./cdndsc");
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
          }
          const parts = url.split("/");
          filenameParts = parts[parts.length - 1]; 
          filenameParts = filenameParts.split("?");
          filename = filenameParts[0];
          const dest = fs.createWriteStream(path.join(folder, `${filename}`));
          imageResponse.body.pipe(dest);
          await new Promise((resolve, reject) => {
            dest.on('finish', () => {
              resolve();
            });
            dest.on('error', (error) => {
              reject(error);
            });
          });
          return path.join(folder, `${filename}`);
    } catch (error) {
      //console.error('Error:', error);
      throw error;
    }
}

module.exports = { GetCdnDsc };
