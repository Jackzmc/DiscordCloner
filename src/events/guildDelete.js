const fs = require('fs-extra');
const {config} = require('./modules/db');
if(!config.get('autorestore.enabled').value()) return;
console.info(`[autorestore] Module initalized.`);

const watchedDB = config.get('watched').value();
const watched = watchedDB.guild, prevGuild = watchedDB.dontuse_existing;
/*let watched, prevGuild;
fs.readFile('./db/guild.watch','utf-8').then(guildwatch => {
    const split = guildwatch.split(',');
    watched = split[0], prevGuild = split[1];
})*/
module.exports = async(client,guild) => {
    if(guild.id !== watched) return;
    if(prevGuild) {
        //send to old guild
        const g = await client.guilds.get(prevGuild);
        if(!g) return console.warn('[autorestore] Attempted to use existing restored server but could not find. Halted');
        const channel = g.channels.first();
        const invite = await channel.createInvite({maxAge:0});
        client.config.autorestore.notify_ids.forEach(v => {
            let user = client.users.get(v);
            if(!user) console.warn(`[autorestore] Notify ID ${v} is invalid`)
            user.send(`Automatically detected guild deletion. Restored guild: <${invite.code}>. `)
        })
        return config.set('watched',{guildID:watched,dontuse_existing:g.id}).write()
    }
    console.log('[autorestore] Guild lost, waiting 5 minutes incase.');
    setTimeout(async() => {
        if(!client.guilds.has(guild.id)) {
            console.log('[autorestore] Guild not found, starting restore')
            const rf = JSON.parse(await fs.readFile('./db/guild.json'))
            const newGuild = await client.user.createGuild(rf.guild.name||'Untitled Guild',rf.guild.region);
            await newGuild.channels.forEach(v => v.delete());

            const channel = await newGuild.createChannel('default','text');
            const invite = await channel.createInvite({maxAge:0});

            client.config.autorestore.notify_ids.forEach(v => {
                let user = client.users.get(v);
                if(!user) console.warn(`[autorestore] Notify ID ${v} is invalid`)
                user.send(`Automatically detected guild deletion. Auto-restoring guild: <${invite.url}>. `)
            })
            await require('../commands/restore.js').restoreGuild(newGuild,rf);
            config.set('watched',{guildID:newGuild.id}).write()
        }else {
            console.info('[autorestore] Cancelled: Guild now available')
        }
    },1000 * 300)
}