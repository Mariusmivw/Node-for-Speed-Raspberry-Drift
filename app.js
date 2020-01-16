const http = require('http');
const static = require('node-static');
const file = new static.Server('./');
const s = http.createServer((req, res)=>file.serve(req, res));
const ps = require('js-peers')(s);

let peerId;
ps.on('connection', (peer)=>{
	if (peerId) {
		peer.emit('request', peerId)
	} else {
		peerId = peer.id;
		console.log('primed')
	}
});
s.listen(3000);