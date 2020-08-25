export default function visualize() {

    WIDTH = canvas.width;
    HEIGHT = canvas.height;


    var visualSetting = visualSelect.value;
    console.log(visualSetting);

    if (visualSetting == "frequencybars") {

        analyser.fftSize = 128;
        var bufferLengthAlt = analyser.frequencyBinCount / 2;
        console.log(bufferLengthAlt);
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);
  
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  
        var drawAlt = function() {
        
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
            canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);
  
            x += barWidth + 1;
          }
        };
  
        drawAlt();
  
      }
}