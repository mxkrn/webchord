import { basic } from './templates/basic.js';
import { processAudio, trimBuffer, detectChord } from './scripts/achord.js';

function init() {
  /* 
  Setup mediaDevices, AudioContext, and analyser instances
  Code based on https://github.com/mdn/voice-change-o-matic/blob/gh-pages/scripts/app.js
  */
  if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {

          var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

          if (!getUserMedia) {
            return Promise.reject(new Error("getUserMedia is not implemented in this browser"));
          }
          return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
      }
  }
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  let source;
  let stream;
  let i = 0;
  
  const analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothTimeConstant = 0.85;
  const gainNode = audioCtx.createGain();

  if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');
    var constraints = {audio: true}
    navigator.mediaDevices.getUserMedia (constraints)
      .then(
        function(stream) {
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioCtx.destination);
            visualize();
      })
      .catch( function(err) { console.log('The following gUM error occured: ' + err);})
  } else {
    console.log('getUserMedia not supported on your browser!');
  }

  /*
  Setup chord detection
  */
  const templates = {
    'majmin': basic
  }
  let model = templates['majmin']; // defaults to basic model

  // Audio processing
  let eventTracker = 0;
  let chromaBuffer = [];

  /*
  Setup display elements
  */
  const canvas = document.querySelector(".visualizer");
  const canvasCtx = canvas.getContext("2d");
  const chordDisplay = document.getElementById("chordDisplay");

  let intendedWidth = document.querySelector('.container').clientWidth;
  canvas.setAttribute("width", intendedWidth);

  const visualSelect = document.getElementById("visual");
  let drawVisual;

  function visualize() {

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    let chord = "X";

    var visualSetting = visualSelect.value;
    console.log(visualSetting);

    if (visualSetting == "frequencybars") {
      
        analyser.fftSize = 2048;
        var bufferLengthAlt = analyser.frequencyBinCount / 2; // only plot "lower" frequency bins as we are not interested in anything over 20k Hz anyway
        console.log(bufferLengthAlt);
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);
  
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  
        const drawAlt = async function() {
          drawVisual = requestAnimationFrame(drawAlt);
          analyser.getByteFrequencyData(dataArrayAlt);
  
          canvasCtx.fillStyle = 'rgb(0, 0, 0)';
          canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
          var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
          var barHeight;
          var x = 0;
  
          for(var i = 0; i < bufferLengthAlt; i++) {
            barHeight = dataArrayAlt[i];
  
            canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
            canvasCtx.fillRect(x,HEIGHT-barHeight,barWidth,barHeight*4);
  
            x += barWidth + 1;
          }
          [chromaBuffer, eventTracker] = await processAudio(dataArrayAlt, chromaBuffer, eventTracker)
          trimBuffer(chromaBuffer);
        };
  
        drawAlt();
        window.setInterval(async function() {
          chord = await detectChord(chromaBuffer, chord, model)
          chordDisplay.innerHTML = chord;
        }, 500)
  
      } else if (visualSetting == "off") {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "red";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      }
  }  

  visualSelect.onchange = function() {
    window.cancelAnimationFrame(drawVisual);
    visualize();
  }
  
  const mute = document.querySelector('.mute');
  mute.onclick = voiceMute;

  function voiceMute() {
    if (mute.id === "") {
      gainNode.gain.value = 0;
      mute.id = "activated";
      mute.innerHTML = "Unmute";
    } else {
      gainNode.gain.value = 1;
      mute.id = "";
      mute.innerHTML = "Mute";
    }
  }
}

init();