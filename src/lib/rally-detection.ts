/**
 * Client-side rally detection using Web Audio API.
 * Analyzes audio amplitude to find rally segments (loud = playing, quiet = pause).
 * No ML models, no dependencies, no cost — pure signal processing.
 */

export interface DetectedRally {
  number: number;
  startSeconds: number;
  endSeconds: number;
  startTime: string; // MM:SS
  endTime: string;   // MM:SS
  durationSeconds: number;
}

export interface RallyDetectionResult {
  rallies: DetectedRally[];
  totalDuration: number;
}

// --- Config ---

const WINDOW_MS = 100;           // Analyze audio in 100ms windows
const MIN_RALLY_DURATION = 1.5;  // Rally must be at least 1.5s
const MIN_PAUSE_DURATION = 1.0;  // Pause between rallies must be at least 1.0s
const BUFFER_BEFORE = 0.3;       // Add 0.3s before detected rally start
const BUFFER_AFTER = 0.5;        // Add 0.5s after detected rally end

// --- Main function ---

export async function detectRallies(videoFile: File): Promise<RallyDetectionResult> {
  const audioContext = new AudioContext();

  try {
    // Decode audio from video
    const arrayBuffer = await videoFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // Mono
    const duration = audioBuffer.duration;

    // Calculate RMS amplitude per window
    const windowSamples = Math.floor(sampleRate * WINDOW_MS / 1000);
    const amplitudes: number[] = [];

    for (let i = 0; i < channelData.length; i += windowSamples) {
      const end = Math.min(i + windowSamples, channelData.length);
      let sum = 0;
      for (let j = i; j < end; j++) {
        sum += channelData[j] * channelData[j];
      }
      const rms = Math.sqrt(sum / (end - i));
      amplitudes.push(rms);
    }

    // Calculate adaptive threshold using percentile-based approach
    const sorted = [...amplitudes].sort((a, b) => a - b);
    const noiseFloor = sorted[Math.floor(sorted.length * 0.25)]; // 25th percentile = quiet
    const peakLevel = sorted[Math.floor(sorted.length * 0.85)];  // 85th percentile = loud

    // Threshold: midpoint between noise and peaks, biased toward noise
    const threshold = noiseFloor + (peakLevel - noiseFloor) * 0.35;

    // Classify each window as active or quiet
    const windowDuration = WINDOW_MS / 1000;
    const isActive = amplitudes.map((amp) => amp > threshold);

    // Smooth: fill short gaps (< MIN_PAUSE_DURATION) within active regions
    const minPauseWindows = Math.ceil(MIN_PAUSE_DURATION / windowDuration);
    for (let i = 0; i < isActive.length; i++) {
      if (!isActive[i]) {
        // Check if this gap is shorter than min pause
        let gapEnd = i;
        while (gapEnd < isActive.length && !isActive[gapEnd]) gapEnd++;
        const gapLength = gapEnd - i;

        if (gapLength < minPauseWindows && i > 0 && gapEnd < isActive.length) {
          // Fill the gap
          for (let j = i; j < gapEnd; j++) isActive[j] = true;
        }
        i = gapEnd - 1; // Skip ahead
      }
    }

    // Extract continuous active segments
    const rawSegments: { start: number; end: number }[] = [];
    let segStart: number | null = null;

    for (let i = 0; i < isActive.length; i++) {
      if (isActive[i] && segStart === null) {
        segStart = i * windowDuration;
      } else if (!isActive[i] && segStart !== null) {
        rawSegments.push({ start: segStart, end: i * windowDuration });
        segStart = null;
      }
    }
    if (segStart !== null) {
      rawSegments.push({ start: segStart, end: isActive.length * windowDuration });
    }

    // Filter by minimum rally duration and add buffers
    const rallies: DetectedRally[] = [];
    let number = 1;

    for (const seg of rawSegments) {
      const segDuration = seg.end - seg.start;
      if (segDuration < MIN_RALLY_DURATION) continue;

      const startSeconds = Math.max(0, seg.start - BUFFER_BEFORE);
      const endSeconds = Math.min(duration, seg.end + BUFFER_AFTER);

      rallies.push({
        number,
        startSeconds,
        endSeconds,
        startTime: formatTimestamp(startSeconds),
        endTime: formatTimestamp(endSeconds),
        durationSeconds: Math.round((endSeconds - startSeconds) * 10) / 10,
      });
      number++;
    }

    console.log(
      `[RallyDetection] ${rallies.length} rallies detected in ${Math.round(duration)}s video. ` +
      `Threshold: ${threshold.toFixed(4)}, Noise floor: ${noiseFloor.toFixed(4)}, Peak: ${peakLevel.toFixed(4)}`
    );

    return { rallies, totalDuration: duration };
  } finally {
    await audioContext.close();
  }
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
