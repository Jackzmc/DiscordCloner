const low = require('lowdb');
const fs = require('fs-extra')
const FileSync = require('lowdb/adapters/FileSync');
module.exports = low(new FileSync('db/config.json'));

const configDefault = fs.readJSONSync('./db/config.sample.json','utf-8');

this.defaults(configDefault).write()
