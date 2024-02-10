const { ShardingManager } = require("discord.js");
require("dotenv").config();

const manager = new ShardingManager("./src/bot.js", {
  token: process.env.BOT_TOKEN,
});
manager.on("shardCreate", (shard) =>
  console.log(`[CLIENT] Launched shard ${shard.id}`),
);

manager.spawn();
