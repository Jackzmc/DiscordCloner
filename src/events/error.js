
module.exports = async (client,err) => {
    if(err.error.code === 'ECONNRESET') return; //connection issue, ignore
    console.error(`[Error] ${err.message}`)
    console.log(err)
}
