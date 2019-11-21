let loadedModules = {};

module.exports = async (client) => {
	//client.user.setActivity('you :)',{type:'WATCHING'})
	console.info(`[core] Bot now ready - ${new Date}`)
	if(!loadedModules.autosave) loadedModules.autosave = require('../modules/autosave.js')(client);
}