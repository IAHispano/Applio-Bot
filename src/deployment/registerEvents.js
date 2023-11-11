const fs = require("fs");
const path = require("path");
const client = require("../bot.js");

const eventsPath = path.join(__dirname, "../events");

function getFiles(dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

const eventFiles = getFiles(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(file);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
