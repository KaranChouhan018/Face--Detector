const video = document.getElementById("video");

// Load the models from the local 'models' directory
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.ageGenderNet.loadFromUri("./models"),
]).then(startWebCam);

function startWebCam() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error("Error accessing the webcam:", error);
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  faceapi.matchDimensions(canvas, { width: video.width, height: video.height });

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    
    // Clear the canvas for each new set of detections
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // Resize the detections to match the video dimensions
    const resizedDetections = faceapi.resizeResults(detections, {
      width: video.width,
      height: video.height,
    });

    // Draw detections, landmarks, and expressions
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // Draw age and gender labels
    resizedDetections.forEach((detection) => {
      const box = detection.detection.box;
      const age = Math.round(detection.age);
      const gender = detection.gender;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: `${age} year old ${gender}`,
      });
      drawBox.draw(canvas);
    });

    // Log detections for debugging
    console.log(detections);
  }, 100);
});
