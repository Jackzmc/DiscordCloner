const low = require('lowdb');
const fs = require('fs').promises
const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync('db/config.json'));

const configDefault = fs.readJSONSync('./db/config.sample.json','utf-8');

db.defaults(configDefault).write()

module.exports = db;