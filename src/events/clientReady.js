const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    require("../deployment/deployCommands.js");
    client.user.setPresence({
      activities: [{ name: "applio.org", type: ActivityType.Watching }],
      status: "online",
    });
    console.log(`Starting the bot as ${client.user.tag}...`);
  },
};
