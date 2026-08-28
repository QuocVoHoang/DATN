import type { MotionResult, WasmModule } from './motionTypes';

declare global { interface Window { Module?: Partial<WasmModule> & { onRuntimeInitialized?: () => void; onAbort?: (reason?: unknown) => void }; } }

let modulePromise: Promise<WasmModule> | null = null;

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
  const pointer = module._malloc(input.length);
  try {
    module.HEAPU8.set(input, pointer);
    const outputPointer = module._processMotion(pointer, image.width, image.height, threshold);
    const output = new Uint8ClampedArray(module.HEAPU8.buffer, outputPointer, input.length).slice();
    return { processedData: new ImageData(output, image.width, image.height), changedPixels: module._getChangedPixelCount() };
  } finally { module._free(pointer); }
}

export async function resetWasm(): Promise<void> { (await initWasm())._resetMotionDetector(); }
