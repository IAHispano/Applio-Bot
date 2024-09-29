const { Events } = require("discord.js");

module.exports = {
	name: Events.ThreadCreate,
	once: false,
	async execute(thread) {
		if (thread.parentId === process.env.AI_HISPANO_REQUEST_MODELS_CHANNEL_ID) {
			try {
				const threadOwner = await thread.fetchOwner(); 
				await thread.send(`Hey <@${threadOwner.id}>, your submission sounds interesting. But have you tried to check if the model already exists? If you haven't take a look at https://applio.org/models. If you find it feel free to close this thread.\n-# You can also run the </search:1170110962968301720> command to search for a model by name.`);
			} catch (error) {
				console.error('Error sending thread creation message:', error);
			}
		}
	},
};
