const { PeerConnection } = require('js-peers');
const pc = new PeerConnection('/peers', 'localhost', 3000);

pc.on('ready', ()=>console.log('ready'));
pc.on('accept', ()=>{
	pc.once('open', ()=>pc.emit('test', 'test'))
});
pc.on('test', (data)=>{
	console.log(data)
})