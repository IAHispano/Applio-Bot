const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    require("../classes/deploy.js");
    /*client.user.setPresence({
      activities: [{ name: "applio.org", type: ActivityType.Watching }],
      status: "online",
    });Ç*/
    console.log(`Starting the bot as ${client.user.tag}...`);
  },
};
