const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const app = express();
app.use(express.json());

const CATEGORY_NAME = 'Tickts';
const MESSAGE = 'If you want to add credits, make sure to purchase them from https://chroto.mysellauth.com/';
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY;
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID;

client.on('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('channelCreate', async (channel) => {
  if (channel.parent && channel.parent.name === CATEGORY_NAME) {
    await channel.send(MESSAGE);
  }
});

app.post('/webhook', async (req, res) => {
  const secret = process.env.5767773|P19HX6ZTQxYfbBVRoohSxN2o94DoseBfoRkOGFxv22fc9d63;
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  if (signature !== req.headers['x-signature']) return res.status(401).send('Invalid signature');

  res.send​​​​​​​​​​​​​​​​
