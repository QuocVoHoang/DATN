export type MotionResult = { processedData: ImageData; changedPixels: number };

export type WasmModule = {
  _malloc(size: number): number;
  _free(pointer: number): void;
  _processMotion(pointer: number, width: number, height: number, threshold: number): number;
  _resetMotionDetector(): void;
  _getChangedPixelCount(): number;
  HEAPU8: Uint8Array;
};
