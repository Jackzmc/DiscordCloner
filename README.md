# DiscordCloner
Clone, backup, and restore discord guilds easily
Created by Jackz#7627

# Features
  * Automatic backup
  * Automatic restoring on deletion
  * Clone servers
  * Copy all roles, channels, pins, messages, files

# Setup

Please take a look at `sample.config.json` in the `db/` folder.

Information explaining the config.sample.json will be included later

## Configuration

All configuration is in the config.json file. You can also pass sensitive options with these environmental variables:

`DISCORD_TOKEN` - the discord bot's token

`ENCRYPTION_PASSWORD` - if you want the zips to be encrypted supply this.

`BOT_OWNER_ID` - the bot's owner id (used for permissions)

The above is optional, and you can do all configuration with the config file.

**View the configuration guide for config.json in the [wiki here](https://github.com/Jackzmc/zeko/wiki)**

## Backup Information

Backups will be stored in the backups/ folder as a zip (encrypted if set), with the guild.json file containing guild information, and any channels' files as a folder. 

The zips will be stored up to the maximum set in the config (default 5). The zip file's name will be in the following format:
**guildID_YYYY-MM-DD.zip** (example: 137389758228725761_2019-11-21.zip)