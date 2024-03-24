let track = "";
let lastExpressionValue = 0;
let lastChangeTimestamp = Date.now();
let uri = '';

const trackElement = document.getElementById('track');
const toggleButton = document.getElementById('toggleButton');

toggleButton.addEventListener('click', () => {
  uri = uri === '' ? 'https://blr1.blynk.cloud/external/api/update?token=tKcpaAIuZEhTbnifU8GtKaHhLvff9KjH' : '';
  toggleButton.classList.toggle('on', uri !== ''); 
  console.log('uri:', uri);
});

const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

    // Check if the expression is neutral
    const expressionValue = resizedDetections[0]?.expressions['neutral'] || 0
    if (Math.abs(expressionValue - lastExpressionValue) > 0.1 && Date.now() - lastChangeTimestamp >= 3000) {
      if (expressionValue > 0.8 && expressionValue < 1.0) {
        // Call your function for non-neutral expression
        // Perform fetch request
        if (uri !== '') {
          fetch(uri + '&V0=0')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              console.log('Fetch success:', data);
            })
            .catch(error => {
              console.error('Fetch error:', error);
            });
        }
        track = "close";
        console.log('close');
      } else if (expressionValue < 0.8 && expressionValue > 0) {
        // Call your function for neutral expression
        // Perform fetch request
        if (uri !== '') {
          fetch(uri + '&V0=1')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              console.log('Fetch success:', data);
            })
            .catch(error => {
              console.error('Fetch error:', error);
            });
        }
        track = "open";
        console.log('open');
      } else {
        track = "no detection";
        console.log('no detection');
      }

      // Update last change timestamp and last expression value
      lastChangeTimestamp = Date.now();
      lastExpressionValue = expressionValue;
    }

    // Update the trackElement with the current value of track
    trackElement.innerText = track;
  }, 100)
})
