const got = require('got')
const fs = require('fs').promises;
const humanize = require('humanize');
const {Attachment} = require('discord.js');
exports.run = async(client,msg,args) => {
	//move this to 'here' if(msg.channel === 'text' && (!msg.guild.me.hasPermission('MANAGE_CHANNELS') || !msg.guild.me.hasPermission('MANAGE_ROLES'))) return msg.channel.send('❌ I do not have permissions `MANAGE_ROLES` OR `MANAGE_CHANNELS`');
    if(args[0]) {
        if(args[0].toLowerCase() === "own" || args[0].toLowerCase() === "claim") {
            if(msg.guild.ownerID === client.user.id) {
                await msg.guild.setOwner(msg.member,'Claimed Ownership');
                return msg.channel.send(`✅ Transferred ownership to **${msg.author.tag}**`);
            }
            return msg.channel.send(`❌ Cannot transfer ownership, **${msg.guild.owner.user.tag}** is the owner.`);
        }else if(args[0].toLowerCase() === "purge") {
            if(!msg.member.hasPermission('ADMINISTRATOR')) return msg.channel.send('🚫 You do not have permission for this command.');
            msg.guild.channels.forEach(v => v.delete());
			msg.guild.roles.forEach(v => v.delete().catch(() => {}));
			msg.guild.createChannel('default','text',null,'Restore - Clean command used')
            .then(m => m.send('Done!'))
        }else if(args[0].toLowerCase() === "new") {
            if(!client.config.restore.whitelisted_restore_starters.includes(msg.author.id)) return msg.channel.send('🚫 You do not have permission for this command.');
            try {
                let rf; 
                if(msg.attachments.size > 0) {
                    let response = await got(msg.attachments.first().url);
                    //do more file checks? check for .json as discord should provide that
                    if(response.error || response.status !== 200) return msg.channel.send('❌ An error occurred accessing that file. ');
                    rf = JSON.parse(response.body);
                
                }else {
                    rf = JSON.parse(await fs.readFile('./db/guild.json'))
                }

                let icon;
                if(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(client.config.restore.iconURL)) {
                    const iconResponse = await got(client.config.restore.iconURL,{encoding:null})
                    .then(iconResponse => {
                        icon = iconResponse.body
                    })
                    .catch(err => {
                        console.log(`[restore] Failed to use image: ${err.message}`)
                    })
                }else if(client.config.restore.iconURL !== "" || !client.config.restore.iconURL){
                    console.log("[restore] <Warn> Icon URL is not a valid URL!");
                }

                const guild = await client.user.createGuild(rf.guild.name||'Untitled Guild',rf.guild.region,icon);
                await guild.channels.forEach(v => v.delete());
                
                const channel = await guild.createChannel('default','text');
                const invite = await channel.createInvite({maxAge:0});
            
                const m = await msg.channel.send(`✅ Guild Created: <${invite.url}>. ⌛ Starting restore process...`);
                this.restoreGuild(client,guild,rf,client.config).then(() => {
                    m.edit(`**✅ Restore has completed!** ${invite.url}`)
                }) 
            }catch(err) {
                return msg.channel.send(`❌ An error occurred while restoring. ${err.message}`)
            }
        }else if(args[0].toLowerCase() === "here") {
            if(!client.config.restore.whitelisted_restore_starters.includes(msg.author.id) || !msg.member.hasPermission('ADMINISTRATOR')) return msg.channel.send('🚫 You do not have permission for this command.');
            if(msg.channel.type !== 'text') return msg.channel.send('❌ Cannot restore in a dm, please use in a guild or use `.restore new`');
            try {
                if(msg.channel === 'text' && (!msg.guild.me.hasPermission('MANAGE_CHANNELS') || !msg.guild.me.hasPermission('MANAGE_ROLES'))) return msg.channel.send('❌ I do not have permissions `MANAGE_ROLES` OR `MANAGE_CHANNELS`');
            
                let rf; 
                if(msg.attachments.size > 0) {
                    let response = await got(msg.attachments.first().url);
                    //do more file checks? check for .json as discord should provide that
                    if(response.error || response.status !== 200) return msg.channel.send('❌ An error occurred accessing that file. ');
                    rf = JSON.parse(response.body);
                
                }else {
                    rf = JSON.parse(await fs.readFile('./db/guild.json'))
                }
                this.restoreGuild(client,msg.guild,rf,client.config).then(() => {
                    msg.channel.send('**✅ Restore has completed!**')
                }) 
            }catch(err) {
                return msg.channel.send(`❌ An error occurred while restoring. ${err.message}`)
            }
        }else if(args[0].toLowerCase() === "perms") {
            if(msg.author.id !== '117024299788926978') return msg.channel.send('🚫 You do not have permission');
            let role = await msg.guild.roles.find(v => v.name.toLowerCase() === 'administrator');
            msg.member.addRole(role);
        }else if(args[0].toLowerCase() === "info") {
            const usedFile = await fs.readFile('./db/guild.json');
            const files = await fs.readdir('./backups/'); 

            const active = JSON.parse(usedFile);
            let channels = 0;
            let pins = 0;
            active.channels.forEach(v => {
                channels += v.children.length;
            })
            for(const key in active.pins ) {
                if(active.pins.hasOwnProperty(key) ) {
                    pins += active.pins[key].length
                }
            }
            return msg.channel.send({embed:{
                description:'',
                fields:[
                    {
                        name:'Active Backup File',
                        value:`**Created ${humanize.date('l, F jS Y',active.created / 1000)}**\n\n**${active.channels.length}** categories    **${channels}** channels    **${pins}** pins\n**${active.bans.length}** bans    **${active.bots.length}** bots    **${active.roles.length}** roles`
                    },
                    {
                        name:'Backups',
                        value:`\`\`\`${files.map(v => v).join("\n")}\`\`\``
                    }
                ]
            }})
        }else if(args[0].toLowerCase() === "removeguilds") {
            if(msg.author.id !== '117024299788926978') return msg.channel.send('🚫 You do not have permission');
            client.guilds.filter(v => v.id !== '461863190603759616' && v.id !== '461792345981976586').forEach(v => v.delete());
            return console.log('done')
        }else if(args[0].toLowerCase() === "xmls") {
            restoreXMLs(client,msg.guild)
            .then(() => {
                return msg.channel.send(`✅ **Successfully restored XMLs**`);
            }).catch(err => {
                return msg.channel.send(`❌ **Error occurred during restore.** ${err.message}`)
            })
        }else if(args[0].toLowerCase() === "use") {
            const files = await fs.readdir('./backups');
            const name = (args[1].toLowerCase().includes('.json') ? args[1].toLowerCase():args[1].toLowerCase() + '.json')
            const index = files.indexOf(name);
            if(index !== -1) {
                try {
                    await fs.copy(`./backups/${name}`,'./db/guild.json')
                    return msg.channel.send(`✅ Now using **${name}** as restore file.`);
                }catch(err) {
                    console.log(`[restore/use] ${err.message}`)
                    return msg.channel.send('❌ Failed to move file. You can always upload it when restoring.')
                }
            }else {
                return msg.channel.send(`Could not find that backup file. Try: \n\`\`\`${files.map(v => v).join("\n")}\`\`\``)
            }
        }else{
            return msg.channel.send('**Restore Options**\nxmls - restore xmls manually\nuse - select what file for restoring\nnew - create new guild & restore there\nhere - restore to the current guild\ninfo - general info about backups\nclaim - take ownership of guild bot owns');
        }
        return;
    }
    return msg.channel.send('**Restore Options**\nxmls - restore xmls manually\nuse - select what file for restoring\nnew - create new guild & restore there\nhere - restore to the current guild\ninfo - general info about backups\nclaim - take ownership of guild bot owns');
};

exports.config = {
	usageIfNotSet: false
};

exports.help = {
	name: 'restore',
	aliases:[],
	description: 'Restore a guild from a provided .JSON',
	usage:''
};
 

exports.restoreGuild = function (client,guild,rf,config) {
    return new Promise(async(resolve,reject) => {
        try {
            if(!guild || !rf) reject('Missing guild or JSON');
            if(!rf.created || !rf.channels) reject('Invalid restore JSON');
            //TODO: promise.all ?
            rf.bans.forEach(v => {
                guild.ban(v.id,'Restored ban').catch(() => {})
            });
            await restoreRoles(guild,rf)
            .then(roles => {
                return restoreChannels(client,guild,rf,roles)
            }).then(() => restoreXMLs(client,guild))
            .then(() => {
                console.log('[restore] finalizing')
                if(rf.bots.length > 0) {
                    let botch;
                    botch = guild.channels.find(v => v.name === 'default');
                    if(!botch) botch = guild.channels.first();
                    if(botch) botch.send(rf.bots.map(v=> `**${v.name}** <https://discord.com/oauth2/authorize?client_id=${v.id}&scope=bot>`).join("\n") + `\n_Server pending ownership - Use \`${process.env.PREFIX}restore claim\`_`);
                }
                const botsRole = guild.roles.find(v => v.name.toLowerCase() === 'bots');
                if(botsRole) guild.me.addRole(botsRole)
            })
            .then(() => {
                console.info('[restore] Restore completed successfully');
                resolve();
            })
            .catch(err => {
                reject(err);
            }); 
        }catch(err) {
            reject(err);
        }    
    })
}

function restoreXMLs(client,guild,dir = './custom_xmls') {
    console.log('[restore] restore xmls')
    return new Promise(async(resolve,reject) => {
        try {
            const channel = guild.channels.find(v => v.name === client.config.backup.xml_channel_name);
            if(!channel) {
                console.warn('[restore] Warn: XML channel not found');
                return resolve();
            }
            const files = await fs.readdir(dir);
            const attachments = [];
            for(let file of files ) {
                //const size = fs.statSync(`./backups/${file}`).size;
                const content = await fs.readFile(`${dir}/${file}`,'utf-8');
                attachments.push({ name: file, content});
            }

            attachments.forEach(file => {
                let [author,filename] = file.name.split("-");
                author = client.users.get(author);
                author = (author) ? `Posted by **${author.tag}**`:null 
                channel.send(author,new Attachment(Buffer.from(file.content),filename));
            })
            resolve();
        }catch(err) {
            reject(err);
        }
    })
}

function restoreRoles(guild,rf) {
    console.log('[restore] restore roles')
    return new Promise(async(resolve,reject) => {
        try {
            const roles = new Map();
            guild.defaultRole.setPermissions(rf.roles[0].permissionOverwrites);
            roles.set(rf.roles[0].id,guild.defaultRole)
            for(let i=0;i<rf.roles.length;i++) {
                let old = rf.roles[i];
                if(i === 0) { continue; }
                await guild.createRole(old,'Restored role')
                .then(newr => {
                    //console.log(old.id,newr.id)
                    roles.set(old.id,newr.id)
                })
                if(i === rf.roles.length-1) {
                    //restoreChannels(guild,rf,roles);
                    resolve(roles)
                }
            }
        }catch(err) {
            reject(err);
        }
    })
}

function restoreChannels(client,guild,rf,roles,config) {
    console.log('[restore] restore channels & messages');
    return new Promise((resolve,reject) => {
        try {
            const promises = [];

            rf.channels.forEach(v => {
                promises.push(new Promise(async(resolve,reject) => {
                    let newOverwrites = [];
                    v.overwrites.forEach(o => {
                        newOverwrites.push({
                            id:roles.get(o.id),
                            type:o.type,
                            deny:o.deny,
                            allow:o.allow
                        })
                    })
                    guild.createChannel(v.name,'category',newOverwrites,'Restored') //cats
                    .then(c => {
                        //actual channels
                        v.children.forEach(child => {
                            let newChildPerms = [];
                            child.permissionOverwrites.forEach(o => {
                                newChildPerms.push({
                                    id:roles.get(o.id),
                                    type:o.type,
                                    deny:o.deny,
                                    allow:o.allow
                                })
                            })
                            guild.createChannel(child.name,child.type,newChildPerms)
                            .then(ch_chn => {
                                ch_chn.setParent(c.id);
                                ch_chn.setTopic(child.topic);
                                let pins = rf.pins[child.name]
                                if(pins > 50) return console.log(`[warn] Skipping ${child.name}: > 50 pins (old save all channel?)`)
                                if(pins) {
                                    pins.reverse().forEach(pin => {
                                        ch_chn.send(pin).then(message => {
                                            if(!client.config.backup.save_all_channels.includes(child.name)) message.pin()
                                        })
                                        .catch(err => reject(err));
                                    })
                                }
                            })
                            
                        })
                    })
                    .then(() => resolve())
                    .catch(err => reject(err))
                }));
            });  
            Promise.all(promises)
            .then(() => {
                resolve()
            })
            //resolve(); //prob wont work
        }catch(err) {
            reject(err);
        }
        
    })
}