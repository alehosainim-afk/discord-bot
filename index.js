const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const app = express();

const CATEGORY_NAME = 'Tickts';
const MESSAGE = 'If you want to add credits, make sure to purchase them from https://chroto.mysellauth.com/';
const PURCHASE_CHANNEL_ID = '1504492433621254186';
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID;

client.on('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('channelCreate', async (channel) => {
  if (channel.parent && channel.parent.name === CATEGORY_NAME) {
    await channel.send(MESSAGE);
  }
});

client.on('messageCreate', async (message) => {
  if (message.channelId !== PURCHASE_CHANNEL_ID) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const embed = message.embeds[0];
const text = embed.description || embed.fields?.map(f => f.name + ' ' + f.value).join(' ') || '';
console.log('Embed text:', text);
console.log('Embed description:', embed.description);
console.log('Embed fields:', JSON.stringify(embed.fields));

  const idMatch = text.match(/\((\d{17,19})\)/);
  const productMatch = text.match(/\*\*Product:\*\*\s*(.+)/i);
  const quantityMatch = text.match(/\*\*Quantity:\*\*\s*(.+)/i);
  const priceMatch = text.match(/\*\*Amount Paid:\*\*\s*(.+)/i);

  const discordId = idMatch ? idMatch[1] : null;
  const product = productMatch ? productMatch[1].trim() : 'Product';
  const quantity = quantityMatch ? quantityMatch[1].trim() : '1';
  const price = priceMatch ? priceMatch[1].trim() : '?';

  if (!discordId) {
    console.log('No Discord ID found');
    return;
  }

  try {
    const user = await client.users.fetch(discordId);
    await user.send(
      `Thank you for your purchase! I would really appreciate it if you could paste this next message in <#${VOUCH_CHANNEL_ID}>!\n` +
      `+rep @ltcchro bought ${quantity}x ${product} [${price}] thank you legit`
    );
    console.log(`DM sent to ${discordId}`);
  } catch (e) {
    console.log('Could not send DM:', e.message);
  }
});

app.listen(process.env.PORT || 3000);
client.login(process.env.TOKEN);
