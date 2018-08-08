module.exports = async (client) => {
	//client.user.setActivity('you :)',{type:'WATCHING'})
	console.info(`[core] Bot now ready - ${new Date}`)

	require('../modules/autosave.js')(client);

	randomWatch(client);
	setInterval(() => randomWatch(client),3.6e+6) //every hr
}

function randomWatch(client) {
	const guild = client.guilds.get(client.guild);
	const member = guild.members.filter(v => v.id !== client.user.id).random();
	client.user.setActivity((member) ? member.nickname||member.user.username : 'you',{type:'WATCHING'})
}
