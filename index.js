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
  const fields = embed.fields || [];

  let discordId = null;
  let product = 'Product';
  let quantity = '1';
  let price = '?';
  let paymentMethod = '?';

  // Try to get Discord ID from buyer field
  const buyerField = embed.description || embed.fields?.find(f => f.name.toLowerCase().includes('buyer'))?.value || '';
  const idMatch = buyerField.match(/\((\d{17,19})\)/);
  if (idMatch) discordId = idMatch[1];

  for (const field of fields) {
    const name = field.name.toLowerCase();
    if (name.includes('product')) product = field.value;
    if (name.includes('quantity')) quantity = field.value;
    if (name.includes('amount') || name.includes('paid')) price = field.value;
    if (name.includes('payment')) paymentMethod = field.value;
  }

  // Also check description/full text
  const fullText = embed.description || '';
  const productMatch = fullText.match(/Product[:\s]+(.+)/i);
  const quantityMatch = fullText.match(/Quantity[:\s]+(.+)/i);
  const priceMatch = fullText.match(/Amount Paid[:\s]+(.+)/i);

  if (productMatch) product = productMatch[1].trim();
  if (quantityMatch) quantity = quantityMatch[1].trim();
  if (priceMatch) price = priceMatch[1].trim();

  if (!discordId) {
    console.log('No Discord ID found in purchase message');
    return;
  }

  try {
    const user = await client.users.fetch(discordId);
    await user.send(
      `Thank you for your purchase! I would really appreciate it if you could paste this next message in <#${VOUCH_CHANNEL_ID}>!\n` +
      `+rep @ltcchro bought ${quantity}x ${product} [${price}] ${paymentMethod} thank you legit`
    );
    console.log(`DM sent to ${discordId}`);
  } catch (e) {
    console.log('Could not send DM:', e.message);
  }
});

app.listen(process.env.PORT || 3000);
client.login(process.env.TOKEN);
