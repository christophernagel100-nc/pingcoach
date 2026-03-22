"use client";

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import type { PoseData, PoseFrame, Keypoint } from "./types";

let poseLandmarker: PoseLandmarker | null = null;

const LANDMARK_NAMES = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_pinky", "right_pinky",
  "left_index", "right_index", "left_thumb", "right_thumb",
  "left_hip", "right_hip", "left_knee", "right_knee",
  "left_ankle", "right_ankle", "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
];

export async function initPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return poseLandmarker;
}

export async function processVideo(
  videoElement: HTMLVideoElement,
  onProgress?: (progress: number) => void
): Promise<PoseData> {
  const landmarker = await initPoseLandmarker();
  const frames: PoseFrame[] = [];
  const fps = 15; // Sample at 15fps for efficiency
  const duration = videoElement.duration;
  const frameInterval = 1 / fps;
  let currentTime = 0;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    videoElement.currentTime = 0;

    function processFrame() {
      if (currentTime >= duration) {
        resolve({
          frames,
          fps,
          duration_seconds: duration,
        });
        return;
      }

      videoElement.currentTime = currentTime;
    }

    videoElement.onseeked = () => {
      try {
        const result = landmarker.detectForVideo(videoElement, currentTime * 1000);

        if (result.landmarks && result.landmarks.length > 0) {
          const keypoints: Keypoint[] = result.landmarks[0].map(
            (landmark, index) => ({
              name: LANDMARK_NAMES[index] || `landmark_${index}`,
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
              visibility: landmark.visibility ?? 0,
            })
          );

          frames.push({
            timestamp: currentTime,
            keypoints,
          });
        }

        currentTime += frameInterval;
        onProgress?.(Math.min((currentTime / duration) * 100, 100));
        processFrame();
      } catch (err) {
        reject(err);
      }
    };

    videoElement.onerror = () => reject(new Error("Video-Fehler"));
    processFrame();
  });
}

export function calculateJointAngles(poseData: PoseData): Record<string, number[]> {
  const angles: Record<string, number[]> = {
    right_elbow: [],
    left_elbow: [],
    right_shoulder: [],
    left_shoulder: [],
    right_hip: [],
    left_hip: [],
    right_knee: [],
    left_knee: [],
  };

  for (const frame of poseData.frames) {
    const kp = Object.fromEntries(
      frame.keypoints.map((k) => [k.name, k])
    );

    // Right elbow angle
    if (kp.right_shoulder && kp.right_elbow && kp.right_wrist) {
      angles.right_elbow.push(
        calcAngle(kp.right_shoulder, kp.right_elbow, kp.right_wrist)
      );
    }

    // Left elbow angle
    if (kp.left_shoulder && kp.left_elbow && kp.left_wrist) {
      angles.left_elbow.push(
        calcAngle(kp.left_shoulder, kp.left_elbow, kp.left_wrist)
      );
    }

    // Right shoulder angle
    if (kp.right_hip && kp.right_shoulder && kp.right_elbow) {
      angles.right_shoulder.push(
        calcAngle(kp.right_hip, kp.right_shoulder, kp.right_elbow)
      );
    }

    // Left shoulder angle
    if (kp.left_hip && kp.left_shoulder && kp.left_elbow) {
      angles.left_shoulder.push(
        calcAngle(kp.left_hip, kp.left_shoulder, kp.left_elbow)
      );
    }

    // Right hip angle
    if (kp.right_shoulder && kp.right_hip && kp.right_knee) {
      angles.right_hip.push(
        calcAngle(kp.right_shoulder, kp.right_hip, kp.right_knee)
      );
    }

    // Left hip angle
    if (kp.left_shoulder && kp.left_hip && kp.left_knee) {
      angles.left_hip.push(
        calcAngle(kp.left_shoulder, kp.left_hip, kp.left_knee)
      );
    }

    // Right knee angle
    if (kp.right_hip && kp.right_knee && kp.right_ankle) {
      angles.right_knee.push(
        calcAngle(kp.right_hip, kp.right_knee, kp.right_ankle)
      );
    }

    // Left knee angle
    if (kp.left_hip && kp.left_knee && kp.left_ankle) {
      angles.left_knee.push(
        calcAngle(kp.left_hip, kp.left_knee, kp.left_ankle)
      );
    }
  }

  return angles;
}

export function calculateVelocities(poseData: PoseData): Record<string, number[]> {
  const velocities: Record<string, number[]> = {
    right_wrist: [],
    left_wrist: [],
    right_elbow: [],
    left_elbow: [],
  };

  const trackedParts = ["right_wrist", "left_wrist", "right_elbow", "left_elbow"];

  for (let i = 1; i < poseData.frames.length; i++) {
    const prev = Object.fromEntries(
      poseData.frames[i - 1].keypoints.map((k) => [k.name, k])
    );
    const curr = Object.fromEntries(
      poseData.frames[i].keypoints.map((k) => [k.name, k])
    );
    const dt = poseData.frames[i].timestamp - poseData.frames[i - 1].timestamp;

    if (dt <= 0) continue;

    for (const part of trackedParts) {
      if (prev[part] && curr[part]) {
        const dx = curr[part].x - prev[part].x;
        const dy = curr[part].y - prev[part].y;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        velocities[part].push(speed);
      }
    }
  }

  return velocities;
}

function calcAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

export function drawPose(
  canvas: HTMLCanvasElement,
  keypoints: Keypoint[],
  videoWidth: number,
  videoHeight: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = videoWidth;
  canvas.height = videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connections
  const connections = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ];

  const kpMap = Object.fromEntries(keypoints.map((k) => [k.name, k]));

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;

  for (const [from, to] of connections) {
    const a = kpMap[from];
    const b = kpMap[to];
    if (a && b && a.visibility > 0.5 && b.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(a.x * videoWidth, a.y * videoHeight);
      ctx.lineTo(b.x * videoWidth, b.y * videoHeight);
      ctx.stroke();
    }
  }

  // Draw keypoints
  for (const kp of keypoints) {
    if (kp.visibility < 0.5) continue;
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(kp.x * videoWidth, kp.y * videoHeight, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export { DrawingUtils };
