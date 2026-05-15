const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const CATEGORY_NAME = 'Tickts';
const MESSAGE = 'If you want to add credits, make sure to purchase them from https://chroto.mysellauth.com/';

client.on('ready', () => {
  console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('channelCreate', async (channel) => {
  if (channel.parent && channel.parent.name === CATEGORY_NAME) {
    await channel.send(MESSAGE);
  }
});

client.login(process.env.TOKEN);
