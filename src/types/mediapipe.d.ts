declare module "@mediapipe/tasks-vision" {
  export class PoseLandmarker {
    static createFromOptions(
      vision: FilesetResolver,
      options: Record<string, unknown>
    ): Promise<PoseLandmarker>;
    detectForVideo(
      video: HTMLVideoElement,
      timestampMs: number
    ): {
      landmarks: Array<
        Array<{ x: number; y: number; z: number; visibility?: number }>
      >;
      worldLandmarks: Array<
        Array<{ x: number; y: number; z: number; visibility?: number }>
      >;
    };
    close(): void;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<FilesetResolver>;
  }

  export class DrawingUtils {
    constructor(ctx: CanvasRenderingContext2D);
    drawLandmarks(
      landmarks: Array<{ x: number; y: number; z?: number }>,
      options?: Record<string, unknown>
    ): void;
    drawConnectors(
      landmarks: Array<{ x: number; y: number; z?: number }>,
      connections: Array<{ start: number; end: number }>,
      options?: Record<string, unknown>
    ): void;
  }
}
