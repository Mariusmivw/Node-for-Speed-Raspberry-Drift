const EventEmitter = require('events');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCIceCandidate } = require('./wrtc-prebuilt/lib/index');

const serverName = 'localhost';
const port = 3000;

class Socket extends EventEmitter {
	constructor(url) {
		super();
		const patt = /^(.*?)(?=s?:)/;
		const ws = (this._ws = new WebSocket(
			url.startsWith('/')
				? 'ws://' + serverName + ':' + port.toString() + url
				: url.includes('://')
				? url.replace(patt, 'ws')
				: 'ws://' + url,
			{ perMessageDeflate: false }
		));
		ws.addEventListener('open', () => super.emit('ready'));
		ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			super.emit(data.event, ...data.data);
		});
	}

	emit(event, ...data) {
		this._ws.send(JSON.stringify({ event, data }));
	}
}

class PeerConnection extends EventEmitter {
	constructor(...args) {
		super();
		const pc = (this._peerConnection = new RTCPeerConnection(...args));
		const socket = (this._socket = new Socket(
			serverName + ':' + port.toString() + '/peer'
		));

		this.dataChannel = pc.createDataChannel('dataChannel');
		this.dataChannel.addEventListener('open', () => {
			console.log('channel opened');
			super.emit('open', this.dataChannel);
		});
		pc.addEventListener('icecandidate', function({candidate}) {
			if (!candidate) return;
			socket.emit('candidate', candidate);
		});
		pc.addEventListener('datachannel', (event) => {
			event.channel.addEventListener('message', (event) => {
				event = JSON.parse(event.data);
				console.log('received:', event);
				super.emit(event.event, event.data);
			});
		});

		socket.on('connection', (id) => {
			this.id = id;
			super.emit('ready');
		});
		socket.on('request', (peerId) => {
			super.emit(
				'request',
				peerId,
				() => {
					socket.emit('accept', peerId);
				},
				() => {
					socket.emit('deny', peerId);
				}
			);
		});
		this.on('request', (peerId, accept, deny) => {
			if (this.listeners('request').length == 1) {
				accept();
			}
		});
		socket.on('accept', (peerId) => {
			super.emit('accept', peerId);
			pc.createOffer().then((desc) => {
				pc.setLocalDescription(desc).then(()=>socket.emit('offer', peerId, desc));
			});
		});
		socket.on('deny', (peerId) => {
			super.emit('deny', peerId);
		});
		socket.on('candidate', (candidate) => {
			console.log('got candidate')
			pc.addIceCandidate(new RTCIceCandidate(candidate))
			.then(()=>console.log('added candidate'))
			.catch((e)=>console.warn(e));
		});
		socket.on('offer', (peerId, desc) => {
			console.log('offer');
			console.log(desc);
			pc.setRemoteDescription(desc);
			pc.createAnswer().then((desc) => {
				pc.setLocalDescription(desc);
				socket.emit('answer', peerId, desc);
			});
		});
		socket.on('answer', (peerId, desc) => {
			console.log('answer');
			pc.setRemoteDescription(desc);
		});
	}

	emit(event, data) {
		this.dataChannel.send(JSON.stringify({ event, data }));
	}

	connect(peerId) {
		this._socket.emit('request', peerId);
	}
}

PeerConnection.PeerConnection = PeerConnection;
module.exports = PeerConnection;