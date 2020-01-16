const PeerConnection = require('./PeerConnection');
const pc = new PeerConnection();

pc.on('ready', ()=>console.log('ready'));
pc.on('accept', ()=>{
	pc.once('open', ()=>pc.emit('test', 'test'))
});
pc.on('test', (data)=>{
	console.log(data)
})