/**
 * Client-side video compression using Canvas + MediaRecorder.
 * Reduces resolution to 720p and bitrate to keep file size under target.
 * No external dependencies — uses native browser APIs.
 */

const TARGET_HEIGHT = 720;
const TARGET_BITRATE = 2_500_000; // 2.5 Mbps — good quality for analysis
const COMPRESS_THRESHOLD_MB = 40; // Compress if file > 40MB

export function shouldCompress(file: File): boolean {
  return file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024;
}

export interface CompressProgress {
  phase: "loading" | "compressing" | "done";
  percent: number; // 0-100
}

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressProgress) => void
): Promise<File> {
  onProgress?.({ phase: "loading", percent: 0 });

  // Create video element to read the source
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;

  const videoUrl = URL.createObjectURL(file);

  try {
    // Load video metadata
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Video konnte nicht geladen werden"));
      video.src = videoUrl;
    });

    const srcWidth = video.videoWidth;
    const srcHeight = video.videoHeight;
    const duration = video.duration;

    // Calculate target dimensions (maintain aspect ratio)
    let targetWidth: number;
    let targetHeight: number;

    if (srcHeight <= TARGET_HEIGHT) {
      // Already small enough resolution — just reduce bitrate
      targetWidth = srcWidth;
      targetHeight = srcHeight;
    } else {
      const scale = TARGET_HEIGHT / srcHeight;
      targetHeight = TARGET_HEIGHT;
      targetWidth = Math.round(srcWidth * scale);
      // Ensure even dimensions (required by some codecs)
      targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
    }

    // Set up canvas
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d")!;

    // Find supported MIME type
    const mimeType = getSupportedMimeType();

    // Set up MediaRecorder
    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: TARGET_BITRATE,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    // Start recording
    recorder.start(100); // Collect data every 100ms

    onProgress?.({ phase: "compressing", percent: 0 });

    // Play video and draw to canvas
    video.currentTime = 0;
    await video.play();

    // Speed up playback for faster compression (3x)
    video.playbackRate = 3.0;

    await new Promise<void>((resolve) => {
      const drawFrame = () => {
        if (video.ended || video.paused) {
          resolve();
          return;
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        const percent = Math.min(99, Math.round((video.currentTime / duration) * 100));
        onProgress?.({ phase: "compressing", percent });

        requestAnimationFrame(drawFrame);
      };

      video.onended = () => resolve();
      drawFrame();
    });

    // Stop recording
    recorder.stop();

    // Wait for final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    onProgress?.({ phase: "done", percent: 100 });

    // Create compressed file
    const extension = mimeType.includes("webm") ? "webm" : "mp4";
    const compressedBlob = new Blob(chunks, { type: mimeType });
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, `.${extension}`),
      { type: mimeType }
    );

    console.log(
      `[Compress] ${srcWidth}x${srcHeight} → ${targetWidth}x${targetHeight}, ` +
      `${formatSize(file.size)} → ${formatSize(compressedFile.size)} ` +
      `(${Math.round((1 - compressedFile.size / file.size) * 100)}% kleiner)`
    );

    return compressedFile;
  } finally {
    URL.revokeObjectURL(videoUrl);
    video.remove();
  }
}

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return "video/webm";
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
