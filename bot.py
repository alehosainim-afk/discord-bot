import discord
from discord import app_commands
import re
import os

CATEGORY_NAME = 'Tickts'
MESSAGE = 'If you want to add credits, make sure to purchase them from https://chroto.mysellauth.com/'
PURCHASE_CHANNEL_ID = 1504492433621254186
VOUCH_CHANNEL_ID = 1502780794999930961
LTCCHRO_ID = 1472661189824872622

vouch_count = 97
owners = set()
import random
import string

keys = {}  # key: {'used': False, 'reseller': False}
SERVER_LINK = 'https://discord.gg/n4MhUZr2bZ'
RESELLER_ROLE_ID = 1503674122134356108
RESELLER_SERVER_ID = 1493611654452084866

intents = discord.Intents.default()
intents.guilds = True
intents.guild_messages = True
intents.message_content = True
intents.dm_messages = True

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


@client.event
async def on_ready():
    await tree.sync()
    print(f'Bot is online as {client.user}')


@client.event
async def on_guild_channel_create(channel):
    if channel.category and channel.category.name == CATEGORY_NAME:
        await channel.send(MESSAGE)


@client.event
async def on_message(message):
    global vouch_count

    if message.channel.id == VOUCH_CHANNEL_ID and not message.author.bot:
        try:
            await message.add_reaction('✅')
            await message.reply(f'# Vouch Number: {vouch_count} ✅')
            vouch_count += 1
        except Exception as e:
            print(f'Could not react/reply: {e}')

    if message.channel.id != PURCHASE_CHANNEL_ID:
        return
    if not message.embeds:
        return
    embed = message.embeds[0]
    if embed.description:
        text = embed.description
    elif embed.fields:
        text = ' '.join(f.name + ' ' + f.value for f in embed.fields)
    else:
        text = ''
    print(f'Text: {repr(text)}')

    id_match = re.search(r'\(`(\d{17,19})`\)', text)
    product_match = re.search(r'\*\*Product:\*\*\s*(.+)', text, re.IGNORECASE)
    quantity_match = re.search(r'\*\*Quantity:\*\*\s*(.+)', text, re.IGNORECASE)
    price_match = re.search(r'\*\*Amount Paid:\*\*\s*(.+)', text, re.IGNORECASE)

    discord_id = int(id_match.group(1)) if id_match else None
    product = product_match.group(1).strip() if product_match else 'Product'
    quantity = quantity_match.group(1).strip() if quantity_match else '1'
    price = price_match.group(1).strip() if price_match else '?'

    if not discord_id:
        print('No Discord ID found')
        return

    try:
        user = await client.fetch_user(discord_id)
        await user.send(
            f'Thank you for your purchase! I would really appreciate it if you could paste this next message in <#{VOUCH_CHANNEL_ID}>!\n'
            f'+rep <@1472661189824872622> bought {quantity}x {product} [{price}] thank you legit'
        )
        print(f'DM sent to {discord_id}')
    except Exception as e:
        print(f'Could not send DM: {e}')


@tree.command(name='resetvouch', description='Reset vouch counter')
@app_commands.describe(number='Start number')
async def resetvouch(interaction: discord.Interaction, number: int):
    if interaction.user.id not in owners:
        await interaction.response.send_message('You have no permission to use this command.', ephemeral=True)
        return
    global vouch_count
    vouch_count = number
    await interaction.response.send_message(f'Vouch counter reset to {vouch_count}', ephemeral=True)


@tree.command(name='vouchmsggen', description='Generate vouch message for a customer')
@app_commands.describe(user='The customer', product='Product name', price='Price', payment='Payment method')
async def vouchmsggen(interaction: discord.Interaction, user: discord.User, product: str, price: str, payment: str):
    if interaction.user.id not in owners:
        await interaction.response.send_message('You have no permission to use this command.', ephemeral=True)
        return
    try:
        await user.send(
            f'Thank you for your purchase! I would really appreciate it if you could paste this next message in <#{VOUCH_CHANNEL_ID}>!\n'
            f'+rep <@{LTCCHRO_ID}> bought {product} [{price}] {payment} thank you legit'
        )
        await interaction.response.send_message(f'DM sent to {user}', ephemeral=True)
    except Exception as e:
        await interaction.response.send_message(f'Could not send DM: {e}', ephemeral=True)


SUPER_OWNER = 1472661189824872622

@tree.command(name='setowner', description='Add an owner')
@app_commands.describe(user='The user to add as owner')
async def setowner(interaction: discord.Interaction, user: discord.User):
   if interaction.user.id != SUPER_OWNER:
       await interaction.response.send_message('You are not authorized.', ephemeral=True)
       return
   owners.add(user.id)
   await interaction.response.send_message(f'{user} added as owner', ephemeral=True)


@tree.command(name='removeowner', description='Remove an owner')
@app_commands.describe(user='The user to remove')
async def removeowner(interaction: discord.Interaction, user: discord.User):
   if interaction.user.id != SUPER_OWNER:
       await interaction.response.send_message('You are not authorized.', ephemeral=True)
       return
   owners.discard(user.id)
   await interaction.response.send_message(f'{user} removed as owner', ephemeral=True)


@tree.command(name='generate_key', description='Generate a key')
@app_commands.describe(reseller='Generate a reseller key?', amount='How many keys to generate')
async def generate_key(interaction: discord.Interaction, reseller: bool = False, amount: int = 1):
    if interaction.user.id != SUPER_OWNER:
        await interaction.response.send_message('You are not authorized.', ephemeral=True)
        return
    
    generated = []
    for _ in range(amount):
        if reseller:
            key = 'R' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        else:
            chars = string.ascii_uppercase.replace('R', '') + string.digits
            key = ''.join(random.choices(chars, k=6))
        
        keys[key] = {'used': False, 'reseller': reseller}
        generated.append(f'`{key}`')
    
    await interaction.response.send_message(f'Keys generated:\n' + '\n'.join(generated), ephemeral=True)


@tree.command(name='redeem_key', description='Redeem a key')
@app_commands.describe(key='Your 6-digit key')
async def redeem_key(interaction: discord.Interaction, key: str):
    key = key.upper()
    if key not in keys:
        await interaction.response.send_message('Invalid key.', ephemeral=True)
        return
    if keys[key]['used']:
        await interaction.response.send_message('This key has already been used.', ephemeral=True)
        return
    if key.startswith('R'):
        await interaction.response.send_message('Use /redeem_resellable for reseller keys.', ephemeral=True)
        return
    
    keys[key]['used'] = True
    try:
        guild = client.get_guild(RESELLER_SERVER_ID)
        channel = guild.system_channel
        invite = await channel.create_invite(max_uses=1, unique=True)
        await interaction.user.send(f'Thank you! Here is your server link: {invite.url}')
        await interaction.response.send_message('Check your DMs!', ephemeral=True)
    except:
        await interaction.response.send_message('Could not send DM. Please enable DMs.', ephemeral=True)


@tree.command(name='redeem_resellable', description='Redeem a reseller key')
@app_commands.describe(key='Your reseller key')
async def redeem_resellable(interaction: discord.Interaction, key: str):
    key = key.upper()
    if key not in keys:
        await interaction.response.send_message('Invalid key.', ephemeral=True)
        return
    if keys[key]['used']:
        await interaction.response.send_message('This key has already been used.', ephemeral=True)
        return
    if not key.startswith('R'):
        await interaction.response.send_message('Use /redeem_key for normal keys.', ephemeral=True)
        return
    
    keys[key]['used'] = True
    try:
        guild = client.get_guild(RESELLER_SERVER_ID)
        member = await guild.fetch_member(interaction.user.id)
        if member:
            role = guild.get_role(RESELLER_ROLE_ID)
            await member.add_roles(role)
        await interaction.user.send(f'Your reseller key has been activated. Now you are able to invite other people to the server.\n{SERVER_LINK}')
        await interaction.response.send_message('Check your DMs!', ephemeral=True)
    except Exception as e:
        await interaction.response.send_message(f'Error: {e}', ephemeral=True)


client.run(os.environ['TOKEN'])
