const fs = require('fs').promises;
const backup = require('../commands/backup.js').startBackup;
module.exports = async(client) => {
    if(!client || !client.guilds) return console.warn('[autosave] Var "client" not defined')
    let config;
    try {
        config = JSON.parse(await fs.readFile('./db/config.json'));
    }catch(err) {
        throw new Error('[autosave] Missing config.json file, stopping...');
    }     
    if(!config.autosave || config.autosave.interval <= 0 || !config.autosave.enabled) return;
    const guild = await client.guilds.get(config.autosave.guild)
    if(!guild) return console.error('[autosave] Module disabled: Guild not found');
    const log_channel = await guild.channels.find(v => v.name.toLowerCase() === config.autosave.logging_channel);
    if(config.autosave.logging_channel && config.autosave.logging_enabled && !log_channel) console.warn('[autosave] Warn: Log channel not found')
    console.info(`[autosave] Module initalized. Autosaving every ${config.autosave.interval} hours`);
    setInterval(() => {
        console.log('auto-save debug')
        try {
            backup(client,guild,log_channel,'Auto')
        }catch(err) {
            console.log(`[autosave] Error occurred: ${err.message}`)
        }
    },60000 * 60 * config.autosave.interval)
}