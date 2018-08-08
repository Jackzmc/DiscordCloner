const fs = require('fs-extra')
module.exports = async (client, msg) => {
	if(msg.author.bot) return;
	const args = msg.content.split(/ +/g);
	if(args.length === 0) return;
	const command = args.shift().slice(process.env.PREFIX.length).toLowerCase();
	const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

	if(msg.content.startsWith(process.env.PREFIX)) {

		if(cmd) {
			try {
				return cmd.run(client,msg,args)
			}catch(err) {
				return msg.channel.send({embed:{
					title:'Command Error',
					color:16711680,
					description:`${cmd.help.name} encountered an error:\n${err.message}`
				}})
			}
		}
	}
}