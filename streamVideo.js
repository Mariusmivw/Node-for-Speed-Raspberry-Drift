const { performance } = require('perf_hooks')
const { spawn } = require('child_process');
const sendFrame = require('./car');

let previous = performance.now()
let counter = 0
let fpss = []
function logFps(frameSize) {
	const now = performance.now()
	const fps = 1000 / (now - previous)
	previous = now;
	fpss.push(fps)
	if (++counter % 100 == 0) {
		const avgFps = fpss.reduce((a, b) => a + b) / fpss.length
		console.log(`${avgFps.toFixed(1)} fps,frameSize ${fpss.length} frames total, ${frameSize} frameSize`)
	}
	return fps
}

let stream = {
	w: 1280,
	h: 720,
	fps: 100 // 100 means unlimited
}
stream = {
	w: Math.ceil(stream.w / 32) * 32,
	h: Math.ceil(stream.h / 16) * 16,
	fps: stream.fps
};

// 1024x768		sensor size according to v4l2-ctl -V	max 202 fps
// 1280x720		standard 720p							max 202 fps
// 300x300												max 115 fps

const raspivid = spawn(
	// 'raspivid',
	// ['-t', '0', '-w', stream.w, '-h', stream.h, '-hf', '-fps', stream.fps, '-o', '-']
	'raspividyuv',
	['-rgb', '-o', '-']
)

raspivid.stdout.on('data', (data) => {
  sendFrame({w:stream.w,h:stream.h, data: new UInt8ClampedArray(data)});
	let base64Image = data.toString('base64')
	// console.log(base64Image)
	// process.exit()
	logFps(base64Image.length)
})

raspivid.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});