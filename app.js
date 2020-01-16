const http = require('http');
const static = require('node-static');
const file = new static.Server('./');
const server = http.createServer((req, res)=>file.serve(req, res));

const ps = require('js-peers')(server, '/peers');

let peerId;
ps.on('connection', (peer)=>{
	if (peerId) {
		peer.emit('request', peerId)
	} else {
		peerId = peer.id;
		console.log('primed')
	}
});
server.listen(3000);