client.on('messageCreate', async (message) => {
  if (message.channelId !== PURCHASE_CHANNEL_ID) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const embed = message.embeds[0];
  const text = embed.description || '';

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
