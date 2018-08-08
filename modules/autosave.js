const fs = require('fs-extra');
const backup = require('../commands/backup.js').startBackup;
module.exports = async(client) => {
    let config;
    try {
        config = JSON.parse(await fs.readFile('./db/config.json'));
    }catch(err) {
        throw new Error('[autosave] Missing config.json file, stopping...');
    }     
    if(!config.autosave || config.autosave.interval <= 0) return;
    console.info(`[autosave] Module initalized. Autosaving every ${config.autosave.interval} hours`);
    const guild = await client.guilds.get(config.autosave.guild)
    
    const log_channel = await guild.channels.find(v => v.name.toLowerCase() === config.autosave.logging_channel);
    if(!guild) return console.error('[autosave] Module disabled: Guild not found');
    if(config.autosave.logging_channel && config.autosave.logging_enabled && !log_channel) console.warn('[autosave] Warn: Log channel not found')
    setInterval(() => {
        console.log('auto-save debug')
        try {
            backup(client,guild,log_channel,'Auto')
        }catch(err) {
            console.log(`[autosave] Error occurred: ${err.message}`)
        }
    },60000 * 60 * config.autosave.interval)
}