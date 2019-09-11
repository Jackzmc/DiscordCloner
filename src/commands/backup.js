
    
const fs = require('fs-extra')
const {Attachment} = require('discord.js');
const filesize = require('file-size');
const jzip = require('jszip')
const config = require('../db/config.json');

exports.manageBackups = async() => {
    const files = await fs.readdir('./backups/');
    const current_latest = files.indexOf('latest.json');
    if(current_latest !== -1) {
        console.log('Archiving backup');
        const info = require(__dirname + `/../backups/latest.json`);
        await fs.rename(`./backups/latest.json`,`./backups/backup-${info.created}.json`);
    }
    //older
    if(files > config.maxbackups++) { //add one for latest.json
        let dates = files.map(v => {
            if(v === 'latest') return;
            return v.split('-')[1].replace('.json','');
        })
        dates.sort((a, b) => a - b); //sort by number 
        console.log(`[backup] deleting backup-${dates[0]}.json`);
        await fs.unlink(__dirname + `/../backups/backup-${dates[0]}.json`)
    } 
}
exports.getLatestBackup = async() => { //gets latest (non latest.json) backup
    return new Promise(async(resolve,reject) => {
        const files = await fs.readdir('./backups/');
        let dates = files.map(v => {
            if(v === 'latest.json') return;
            return v.split('-')[1].replace('.json','');
        })
        return resolve(dates.sort((a, b) => b - a)[0]); //sort by number 
    })
}

exports.run = async(client,msg,args) => {
    if(!msg.member.hasPermission('ADMINISTRATOR')) {
        if(msg.author.id !== '117024299788926978') return msg.channel.send('🚫 You do not have permission to manage backups.');
    }
    
    if(args[0]) {
        if(args[0].toLowerCase() === 'start') {
            //perm check
            if(!msg.guild.me.hasPermission('BAN_MEMBERS')) return msg.channel.send('❌ Need ban permissions to view ban list.')
            this.startBackup(client,msg.guild,msg.channel,msg.author.tag)
            .then((output) => {
                msg.channel.send(`✅ **Backup complete: Saved ${output.xmls} new XMLs**`,new Attachment(Buffer.from(output.json),`backup-${Date.now()}.json`))
            }).catch(err => {
                msg.channel.send(`❌ **Error occurred during backup: ** \`${err.message}\``);
                console.error(err.stack);
            });
        }else if(args[0].toLowerCase() === 'xml' || args[0].toLowerCase() === "xmls") {
            saveXMLs(client,msg.guild)
            .then(amount => {
                return msg.channel.send(`✅ Backed up a total of **${amount}** new XMLs`)
            }).catch(err => {
                return msg.channel.send(`❌ **An error occurred while backing up XMLs:** ${err.message}`)
            })
        }else if(args[0].toLowerCase() === 'list') {
            if(args[1] === "xml" || args[1] === "xmls") {
                try {
                    const zip = new jzip();
                    const files = await fs.readdir('./custom_xmls');
                    for(let file of files) {
                        const content = await fs.readFile(`./custom_xmls/${file}`);
                        zip.file(file,content)
                    }
                    const attachment = new Attachment(zip.generateNodeStream({type:'nodebuffer'}),'custom_vehicle_xmls.zip');
                    return msg.channel.send(`There is **${files.length}** XMLs`,attachment)
                }catch(err) {
                    return msg.channel.send(`❌ Error while zipping: \`${err.message}\``);
                }
                return;
            }
            const finalFiles = [];
            const files = await fs.readdir('./backups/');
            const latest = await this.getLatestBackup();
            console.log(latest)
            for(let file of files ) {
                //const size = fs.statSync(`./backups/${file}`).size;
                const content = await fs.readFile(`./backups/${file}`);
                finalFiles.push({ name: file, content});
            }
            msg.channel.send(`There are **${files.length}/${config.maxBackups++}** stored backups. Latest file is **backup-${latest}.json**`,{files:finalFiles.map(v => { return {attachment:v.content,name:v.name} })});
            //return finalFiles.forEach(v => `${v.name} - ${filesize(v.size).human('si')}`).join("\n") + "```");
        }else if(args[0].toLowerCase() === "overwrite" || args[0].toLowerCase() === "set") {
            return msg.channel.send('Soon:tm: - For now overwrite `latest.json`! ')
        }else{
            return msg.channel.send('Unknown option');
        }
    }else{
        return msg.channel.send('**Options:**\nstart - create a new backup\nlist - view all stored backups\nget - Get a certain backup\nconfig - change backup settings\noverwrite - set the primary backup to restore from')
    }
};

exports.config = {
	usageIfNotSet: false
};

exports.help = {
	name: 'backup',
	aliases:[],
	description: 'Backup stuffs',
	usage:''
};
 
exports.startBackup = (client,guild,channel,starter) => {
    return new Promise(async(resolve,reject) => {
        try {
            let message;
            if(channel && starter !== 'Auto') message = await channel.send(`⌛ **Manual backup started by ${starter}**`);

            if(client.debug) console.log(`[backup] Backup has started (${starter})`);

            const promiseOut = await Promise.all([
                getChannels(client,guild),
                getGuildMisc(client,guild),
                getRoles(client,guild),
                saveXMLs(client,guild)
            ]).catch(err => {
                reject(err);
            })
            const output = JSON.stringify({created:`${Date.now()}`,guild:promiseOut[1][0],channels:promiseOut[0][0],pins:promiseOut[0][1]
            ,roles:promiseOut[2],bans:promiseOut[1][1],bots:promiseOut[1][2]});
            //[[channels,pins],[guildi,bans,bot],[roles]]
            await fs.writeFile('./backups/latest.json',output);
            if(message) message.delete();
            if(channel && starter === 'Auto') {
                await channel.send('<@!117024299788926978> ✅ **Auto backup complete**',new Attachment(Buffer.from(output),`backup-${Date.now()}.json`))
                .catch((err) => reject(err));
            }
            if(client.config.debug) console.log(`[backup] Backup complete! ${starter}`);
            resolve({json:output,xmls:promiseOut[3]});
        }catch(err) {
            reject(err);
        }
    });
}

function getChannels(client,guild) {
    return new Promise(async(resolve,reject) => {
        try {
            const channels = [];
            const pin_promises = [];
            //let pins = {};

            await guild.channels.filter(v => v.type === 'category').sort((a, b) => a.position - b.position)
            .forEach(v => {
                channels.push({name:v.name,position:v.position,overwrites:v.permissionOverwrites.array(),children:v.children.map(v => { return {name:v.name,topic:v.topic,permissionOverwrites:v.permissionOverwrites.array(),position:v.position,type:v.type}})});
                let pinChannels = v.children.filter(v => v.type === 'text');
                pinChannels.forEach(v => {
                    if(client.config.backup.ignore_channels.includes(v.name.toLowerCase())) return;
                    pin_promises.push(new Promise(async(resolve,reject) => {
                        try {
                            let savedmsgs = [], collection;
                            if(client.config.backup.save_all_channels.includes(v.name.toLowerCase())) {
                                collection = await v.fetchMessages({limit:100}).catch(() => {});
                            }else{
                                collection = await v.fetchPinnedMessages().catch(() => {})
                            }

                            if(!collection) return resolve();
                            if(collection.size === 0) return resolve();
                            if(client.config.debug) console.log(v.name,collection.size);
                            resolve([v.name.toLowerCase(),collection.map(v => `**[${v.author.tag}]** ${v.content.replace(/@/g, "@" + String.fromCharCode(8203))}`)]);
                        }catch(err) {
                            reject(err);
                        }
                    }))
                })
            })
            /*pins = {
                ch1:[pin1,pin2],
                ch2:[pin1]
            }*/
            let pins = {};
            Promise.all(pin_promises)
            .then(values => {
                values.forEach(v => {
                    if(!v) return;
                    pins[v[0]] = v[1];
                })
            }).then(() => {
                resolve([channels,pins])
            })
            //promise.all: [[name,pins],[name,pins]]
            //resolve([channels,pins])
        }catch(err) {
            reject(err);
        }
    })
}
function getGuildMisc(client,guild) {
    return new Promise(async(resolve,reject) => {
        try {
            const guildi = {name:guild.name,region:guild.region};
            const bans = await guild.fetchBans().then(m => m.map(v => v.id));
            const bots = guild.members.filter(v => v.user.bot && v.user.id !== client.user.id).map(v => { return {name:v.user.username,id:v.id}});
            bots.push({name:client.user.username,id:client.user.id});
            resolve([guildi,bans,bots]);
        }catch(err) {
            reject(err);
        }
    })
}

function saveXMLs(client,guild) {
    return new Promise(async(resolve,reject) => {
        try {
            const channel = client.channels.find(v => v.name === client.config.backup.xml_channel_name);
            const attachments = await fs.readdir('./custom_xmls');
            if(!channel) return console.warn('[backup] Warn: XML channel not found');

            let counter = 0;
            await channel.fetchMessages({limit:100})
            .then(msgs => {
                msgs.forEach(m => {
                    if(m.attachments.size === 0) return;
                    m.attachments.forEach(file => {
                        if(attachments.includes(file.filename)) return;
                        if(!file.filename.endsWith('.xml')) return;
                        fs.writeFile(`./custom_xmls/${m.author.id}-${file.filename}`,file.content)
                        .then(() => counter++)
                        .catch(err => reject(err));
                    })
                })
            })
            if(client.config.debug) console.log(`[backup] saved ${counter} new XMLs`)
            resolve(counter);
        }catch(err) {
            reject(err);
        }
    });
}

function getRoles(client,guild) {
    return new Promise((resolve,reject) => {
        try {
            const roles = guild.roles.map(v => {
                return {id:v.id,name:v.name,mentionable:v.mentionable,hoist:v.hoist,permissions:v.permissions,position:v.position,color:v.color,}
            })
            resolve(roles);
        }catch(err) {
            reject(err)
        }
    })
}