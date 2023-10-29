const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  Id: { type: String, required: true },
  reason: String,
});

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

module.exports = Blacklist;
