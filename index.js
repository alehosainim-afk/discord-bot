const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages]
});

const app = express();
app.use(express.json());

const CATEGORY_NAME = 'Tickts';
const MESSAGE = 'If you want to add credits, make sure to purchase them from https://chroto.mysellauth.com/';

client.on('ready', async () => {
  console.log(`Bot is online as ${client.user.tag}`);

  // Register webhook with SellAuth
  try {
    const res = await fetch(`https://api.sellauth.com/v1/shops/229114/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://nodejs-production-f75f2.up.railway.app/webhook`,
        events: ['NOTIFICATION.SHOP_INVOICE_PROCESSED']
      })
    });
    const data = await res.json();
    console.log('Webhook registered:', JSON.stringify(data));
  } catch (e) {
    console.log('Webhook registration error:', e.message);
  }
});

client.on('channelCreate', async (channel) => {
  if (channel.parent && channel.parent.name === CATEGORY_NAME) {
    await channel.send(MESSAGE);
  }
});

app.post('/webhook', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  if (signature !== req.headers['x-signature']) return res.status(401).send('Invalid signature');

  res.sendStatus(200);

  if (req.body.event === 'NOTIFICATION.SHOP_INVOICE_PROCESSED') {
    const invoiceId = req.body.data.invoice_id;

    const response = await fetch(`https://api.sellauth.com/v1/shops/${process.env.229114}/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}` }
    });
    const invoice = await response.json();

    const discordId = invoice.custom_fields?.discord_id || invoice.discord_id;
    const product = invoice.lines?.[0]?.product_name || 'Product';
    const quantity = invoice.lines?.[0]?.quantity || 1;
    const price = invoice.total;
    const paymentMethod = invoice.payment_method;

    if (!discordId) return;

    try {
      const user = await client.users.fetch(discordId);
      await user.send(
        `Thank you for your purchase! I would really appreciate it if you could paste this next message in <#${process.env.VOUCH_CHANNEL_ID}>!\n` +
        `+rep @ltcchro bought ${quantity}x ${product} [${price}] ${paymentMethod} thank you legit`
      );
    } catch (e) {
      console.log('Could not send DM:', e.message);
    }
  }
});

app.listen(process.env.PORT || 3000);
client.login(process.env.TOKEN);
