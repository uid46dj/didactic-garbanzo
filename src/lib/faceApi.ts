import * as faceapi from "face-api.js";

// Public CDN mirror of the face-api.js model weights (manifest files use the
// "-shard1" naming the upstream loader expects). Loaded lazily, once, and
// shared by every camera panel in the app.
const MODEL_URL = "https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights";

let loadPromise: Promise<boolean> | null = null;

export function loadFaceModels(): Promise<boolean> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      return true;
    } catch (err) {
      console.warn("Face model load failed, falling back to simulation", err);
      return false;
    }
  })();
  return loadPromise;
}

export interface NormalizedFace {
  cx: number;
  cy: number;
  w: number;
  h: number;
  score: number;
  yaw: number; // -1 (looking hard left) .. 1 (looking hard right), 0 = straight on
}

const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.4,
});

export async function detectFacesNormalized(
  video: HTMLVideoElement
): Promise<NormalizedFace[]> {
  if (video.readyState < 2 || video.videoWidth === 0) return [];
  try {
    const results = await faceapi
      .detectAllFaces(video, tinyOptions)
      .withFaceLandmarks(true);
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    return results.map((r) => {
      const box = r.detection.box;
      const cx = (box.x + box.width / 2) / vw;
      const cy = (box.y + box.height / 2) / vh;
      const w = box.width / vw;
      const h = box.height / vh;
      const yaw = estimateYaw(r.landmarks);
      return { cx, cy, w, h, score: r.detection.score, yaw };
    });
  } catch (err) {
    return [];
  }
}

// Rough, lightweight "yaw" heuristic from 68pt (tiny = fewer, but positions
// still expose nose/jaw asymmetry): compare horizontal distance from nose
// tip to the left jaw edge vs the right jaw edge. When a person turns away
// from the camera this ratio becomes asymmetric.
function estimateYaw(landmarks: faceapi.FaceLandmarks68): number {
  try {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const noseTip = nose[Math.floor(nose.length / 2)];
    const leftJaw = jaw[0];
    const rightJaw = jaw[jaw.length - 1];
    const leftDist = Math.abs(noseTip.x - leftJaw.x);
    const rightDist = Math.abs(noseTip.x - rightJaw.x);
    const total = leftDist + rightDist || 1;
    const ratio = (rightDist - leftDist) / total; // -1..1
    return ratio;
  } catch {
    return 0;
  }
}
