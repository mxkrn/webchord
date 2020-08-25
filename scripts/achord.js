let sampleRate = 44100;
let frameRate = 60; // requestAnimationFrame updates ~60 / second

/*
---------------------------------------------------------
Audio processing
---------------------------------------------------------
handleAudio: async function to extract chroma from incoming audio
trimBuffer: interval function to limit number of frames in chromaBuffer to bufferLength
*/
const isBelowThreshold = (currentValue) => currentValue < 0.1;

export async function processAudio(dataArray, buffer, event) {
    if (dataArray.every(isBelowThreshold)) {
        event += 1 // invalid data so we increase the eventTracker
    } else {
        buffer.push(dataArray);
        event = 0 // Reset event tracker because we received valid data
    }
	return [buffer, event];
}

export function trimBuffer(buffer) {
	if (buffer.length > (2*frameRate)) {
		buffer.reverse().splice(frameRate);
		buffer.reverse();
	};
	return buffer;
}

/* 
---------------------------------------------------------
Chord Detection
---------------------------------------------------------
detectChord: interval function to detect chord in chromaBuffer using binary template method
*/
export async function detectChord(buffer, chord, model) {
	if (buffer.length > 0) {
		// average all chroma in chromaBuffer
		let chromagram = buffer.reduce(sumVertical).map(i => {
			return i / buffer.length;
		});

		// iterate over model async and update distance if less than previous
		let promises = Object.entries(model).map(async(obj) => {
			const key = obj[0];
			const target = obj[1];

			let distance = dotProduct(chromagram, target);
			return {'chord': key, 
					'score': distance}
		 });
		let scores = await Promise.all(promises)

		// Get minimum distance and key
		let max_score = 0;
		scores.forEach(obj => {
			if (obj['score'] > max_score) {
				max_score = obj['score'];
				chord = obj['chord'];
			};
		});
	}
	return chord;
}

function dotProduct(data, target) {
    let scores = data.map((bin, i) => {
        return bin*target[i];
    });
	// let scores = await Promise.all(promises);
	return scores.reduce((a, b) => a + b, 0)
}

const sumVertical = (r, a) => r.map((b, i) => a[i] + b);