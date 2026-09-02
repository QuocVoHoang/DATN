import type { MotionResult, WasmModule } from './motionTypes';

declare global { interface Window { Module?: Partial<WasmModule> & { onRuntimeInitialized?: () => void; onAbort?: (reason?: unknown) => void }; } }

let modulePromise: Promise<WasmModule> | null = null;
let inputPointer = 0;
let inputCapacity = 0;

export function initWasm(): Promise<WasmModule> {
  if (modulePromise) return modulePromise;
  modulePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = (error: Error) => {
      modulePromise = null;
      script.remove();
      reject(error);
    };
    window.Module = {
      onRuntimeInitialized: () => resolve(window.Module as WasmModule),
      onAbort: (reason?: unknown) => fail(new Error(`WASM runtime aborted${reason ? `: ${String(reason)}` : ''}`)),
    };
    script.src = '/wasm/motion_wasm.js';
    script.onerror = () => fail(new Error('WASM has not been built. Run npm run build:wasm.'));
    document.head.appendChild(script);
  });
  return modulePromise;
}

export async function processWithWasm(image: ImageData, threshold: number): Promise<MotionResult> {
  const module = await initWasm();
  const input = image.data;
  if (input.length > inputCapacity) {
    if (inputPointer) module._free(inputPointer);
    inputPointer = module._malloc(input.length);
    inputCapacity = input.length;
  }
  module.HEAPU8.set(input, inputPointer);
  const outputPointer = module._processMotion(inputPointer, image.width, image.height, threshold);
  const output = new Uint8ClampedArray(module.HEAPU8.buffer, outputPointer, input.length).slice();
  return { processedData: new ImageData(output, image.width, image.height), changedPixels: module._getChangedPixelCount() };
}

export async function resetWasm(): Promise<void> {
  const module = await initWasm();
  module._resetMotionDetector();
}

export async function configureWasmThreads(count: number): Promise<number> {
  const module = await initWasm();
  module._setThreadCount(Math.max(1, Math.min(8, Math.floor(count))));
  return module._getThreadCount();
}
