const { model, Schema } = require("mongoose");

const commandLogSchema = new Schema({
  commandName: String,
  userId: String,
  userName: String,
  guildName: String,
  guildId: String,
  channelName: String,
  channelId: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = model("commandLog", commandLogSchema);
