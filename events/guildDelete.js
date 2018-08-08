const fs = require('fs-extra');

console.info(`[autorestore] Module initalized.`);
let watched, prevGuild;
fs.readFile('./db/guild.watch','utf-8').then(guildwatch => {
    const split = guildwatch.split(',');
    watched = split[0], prevGuild = split[1];
})
module.exports = async(client,guild) => {
    if(guild.id !== watched) return;
    if(!client.config.autorestore || !client.config.autorestore.enabled) return;
    if(prevGuild !== "false") {
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
        await fs.writeFile('./db/guild.watch',`${watched},${g.id}`);
        return;
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
            await fs.writeFile('./db/guild.watch',`${newGuild.id},false`);
        }else {
            console.info('[autorestore] Cancelled: Guild now available')
        }
    },1000 * 300)
}