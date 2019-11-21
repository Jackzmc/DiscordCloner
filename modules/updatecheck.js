const got = require('got')
const {version} = require('../package.json')
module.exports = async(client) => {
    const response = await got('https://raw.githubusercontent.com/Jackzmc/DiscordCloner/master/package.json',{json:true})
    if(response.body.version > version) return console.log('[updatechecker] Your DiscordCloner version is out of date.');
}