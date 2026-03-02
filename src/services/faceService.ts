import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return;
  
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
};

export const getFaceEmbedding = async (videoElement: HTMLVideoElement) => {
  const detection = await faceapi
    .detectSingleFace(videoElement)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!detection) return null;
  return Array.from(detection.descriptor);
};
