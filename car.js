const {
	PeerConnection,
	nonstandard: {
		RTCVideoSink,
		RTCVideoSource,
		i420ToRgba,
		rgbaToI420
	}
} = require('js-peers');
const pc = new PeerConnection('/peers', 'localhost', 3000);

const source = new RTCVideoSource();
const track = source.createTrack();
// const sink = new RTCVideoSink(transceiver.receiver.track);

// let lastFrame = null;

// function onFrame({ frame }) {
// 	lastFrame = frame;
// }

// sink.addEventListener('frame', onFrame);
// source.onFrame(i420Frame);

const { close } = pc._peerConnection;
pc._peerConnection.close = function() {
	sink.stop();
	track.stop();
	return close.apply(this, arguments);
}

pc.on('ready', ()=>console.log('ready'));
pc.on('accept', ()=>{
	pc.once('open', ()=>{
		pc.emit('test', 'test')
		const transceiver = pc._peerConnection.addTranseiver(track);
	});
});
pc.on('test', (data)=>{
	console.log(data)
});
module.exports = source.onFrame.bind(source);