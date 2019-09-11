exports.run = (client,msg,args) => {
	require('./backup.js').manageBackups();
};

exports.config = {
	usageIfNotSet: false
};

exports.help = {
	name: 'test',
	aliases:[],
	description: '',
	usage:''
};
 