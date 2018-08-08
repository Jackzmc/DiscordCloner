const Discord = require("discord.js");
const util = require('util');
const {stripIndents} = require('common-tags');
exports.run = async (client, msg, args) => {
	if(msg.author.id !== "117024299788926978") return;
	msg.delete().catch(() => {});
	let output = true;
	if(args[0] === "no-output" || args[0] === "output:false") {
		output = false;
		args = args.slice(1);
	}
	const code = args.join(" ");
	if(!code) return msg.reply("there is no code to run?");

	if(!output) {
		try {
			eval(code);
		}catch(err) {
			msg.channel.send(`Eval failed \`\`${err.message}\`\``);
		}
		console.log(`⚠ ${msg.author.tag} ran an eval command: ${code}`);
		return;
	}
	try {
		const evaled = await eval(code);
		const type = typeof(evaled);
		if(evaled && evaled.length >= 1024 ) {
			return msg.channel.send(evaled.slice(1020) + '...');
		}
		if(!msg.channel) return;
		msg.channel.send({embed:{
			author:{
				name:msg.author.username,
				icon_url:msg.author.avatarURL
			},
			color:client.color,
			fields:[
				{
					name:"📥 INPUT",
					value:`\`\`\`js\n${code}\`\`\``,
					inline:true
				},
				{
					name:`📤 OUTPUT <${type}>`,
					value:`\`\`\`js\n${evaled}\n\`\`\``,
					inline:true
				}
			],
			footer:{text:`d.js v${Discord.version} | node ${process.version}`}
		}});
		
	}catch(err) {
		msg.channel.send({embed:{
			author:{
				name:msg.author.username,
				icon_url:msg.author.avatarURL
			},
			color:client.color,
			fields:[
				{
					name:"📥 INPUT",
					value:`\`\`\`js\n${code}\`\`\``,
					inline:true
				},
				{
					name:`📤 OUTPUT`,
					value:`\`\`\`js\n${err.message}\n\`\`\``,
					inline:true
				}
			],
			footer:{text:(err.constructor) ? err.constructor.name : 'Unknown type of error'}
		}});
		
		//msg.channel.send(`\`ERROR\` \`\`\`xl\n${client.clean(err)}\n\`\`\``);
	}
};

exports.config = {
	enabled: true,
	usageIfNotSet: true,
	guildOnly:true,
	permissions:5,
	group:'dev',
	hidden:true //dev mode
};

exports.help = {
	name: 'eval',
	aliases:[],
	description: 'Evalutes code',
	usage:'eval <test command>',
};
 
