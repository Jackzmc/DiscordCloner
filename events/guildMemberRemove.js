module.exports = async(client,member) => {
    if(member.guild.id !== client.guild) return;
    if(client.config.log.joinleave === "") return;
    const channel = client.channels.find(v => v.name.toLowerCase() === client.config.log.joinleave.toLowerCase());
    if(!channel) return console.warn('[memberLog] Channel was not found');
    if(channel.members.has('300800171988484096')) return;
    channel.send(`📤 **${member.user.tag} has left the guild.**`);
};