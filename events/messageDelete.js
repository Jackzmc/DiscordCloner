const humanize = require('humanize');
module.exports = (client,msg) => {
    if(msg.guild.id !== client.guild) return;
    if(client.config.log.deleted === "") return;
    if(msg.author.bot) return;
    const channel = client.channels.find(v => v.name.toLowerCase() === client.config.log.deleted.toLowerCase());
    if(!channel) return console.warn('[deleteLog] Channel was not found');
    if(channel.members.has('300800171988484096')) return;

    if(msg.content.startsWith(".") || msg.content.startsWith(";")) return;
    channel.send({embed:{
        author:{
            name:`Message by ${msg.author.tag} deleted in #${msg.channel.name}`,
            icon_url:msg.author.avatarURL
        },
        color:msg.member.displayColor,
        description:`**User ID:** ${msg.author.id}\n**Message ID:** ${msg.id}\n\n${msg.content}`,
        footer:{
            text:humanize.date('M jS Y, g:ia ') + " CST"
        }
    }})
    //Jul 19th 2018, 5:22pm UTC
}