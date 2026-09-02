import { useEffect, useRef, useState } from 'react';
import { configureWasmThreads, processWithWasm, resetWasm } from '../engine/wasmMotion';
import { clampRoi, countPixelsInRoi, type ROI } from '../features/roi';
import { MotionEventTracker, type MotionEvent } from '../features/motionEvents';
import { detectMovingObjects, type MovingObject } from '../features/movingObjects';
import { getProcessingSize, resolutionPresets, type ResolutionPreset } from '../features/processingResolution';
import { createEventCsv, createEventJson, downloadTextFile } from '../features/eventExport';

const defaultRoi: ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const minThreshold = 1;
const maxThreshold = 255;
const maxLatencySamples = 180;
const minObjectArea = 40;
const frameBudgetMs = 33.3;
const adaptiveAlpha = 1.1;
const adaptiveBeta = 0.8;
const downshiftHoldWindows = 2;
const upshiftHoldWindows = 5;
export type { ResolutionPreset } from '../features/processingResolution';
const resolutionOrder = resolutionPresets.map((item) => item.value);

type BrowserStatus = {
  crossOriginIsolated: boolean;
  sharedArrayBuffer: boolean;
  webAssembly: boolean;
  camera: boolean;
  offscreenCanvas: boolean;
};

type RuntimeStatus = {
  wasmEngine: 'active' | 'inactive';
  canvasCapture: 'active' | 'inactive';
  canvasRender: 'active' | 'inactive';
  roiFiltering: 'active' | 'inactive';
  cameraInput: 'active' | 'inactive';
  offscreenCanvasWorker: 'active' | 'inactive';
  pthreads: 'available' | 'unavailable';
  activeThreads: number;
};

function percentile(samples: number[], p: number) {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[Math.max(0, index)];
}

function clampThreshold(value: number) {
  if (!Number.isFinite(value)) return minThreshold;
  return Math.min(maxThreshold, Math.max(minThreshold, Math.round(value)));
}

export function useMotionAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
  const frameRequestRef = useRef<number | null>(null);
  const sourceRequestRef = useRef(0);
  const tracker = useRef(new MotionEventTracker());

  const [status, setStatus] = useState('No video selected');
  const [sourceReady, setSourceReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(30);
  const [resolutionPreset, setResolutionPreset] = useState<ResolutionPreset>('1080p');
  const resolutionPresetRef = useRef(resolutionPreset);
  const [processingSize, setProcessingSize] = useState({ width: 0, height: 0 });
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [effectiveResolutionPreset, setEffectiveResolutionPreset] = useState<ResolutionPreset>('1080p');
  const adaptiveEnabledRef = useRef(false);
  const effectiveResolutionRef = useRef(effectiveResolutionPreset);
  const thresholdRef = useRef(threshold);
  const [roi, setRoiState] = useState(defaultRoi);
  const roiRef = useRef(roi);
  const [fps, setFps] = useState(0);
  const [wasmLatency, setWasmLatency] = useState(0);
  const [endToEndLatency, setEndToEndLatency] = useState(0);
  const [p95, setP95] = useState(0);
  const [p99, setP99] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [activeThreads, setActiveThreads] = useState(1);
  const [motion, setMotion] = useState(0);
  const [events, setEvents] = useState<MotionEvent[]>([]);
  const [movingObjects, setMovingObjects] = useState<MovingObject[]>([]);
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({
    crossOriginIsolated: false,
    sharedArrayBuffer: false,
    webAssembly: false,
    camera: false,
    offscreenCanvas: false,
  });
  const runtimeStatus: RuntimeStatus = {
    wasmEngine: 'active',
    canvasCapture: 'active',
    canvasRender: 'active',
    roiFiltering: 'active',
    cameraInput: 'inactive',
    offscreenCanvasWorker: 'inactive',
    pthreads: browserStatus.crossOriginIsolated && browserStatus.sharedArrayBuffer ? 'available' : 'unavailable',
    activeThreads,
  };
  const latencySamplesRef = useRef<number[]>([]);
  const slowWindowsRef = useRef(0);
  const fastWindowsRef = useRef(0);

  useEffect(() => {
    const nextStatus = {
      crossOriginIsolated: globalThis.crossOriginIsolated === true,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined',
      camera: Boolean(navigator.mediaDevices?.getUserMedia),
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    };
    setBrowserStatus(nextStatus);
    if (nextStatus.crossOriginIsolated && nextStatus.sharedArrayBuffer) {
      const cores = navigator.hardwareConcurrency || 2;
      const count = cores >= 8 ? 4 : cores >= 4 ? 2 : 1;
      setActiveThreads(count);
      void configureWasmThreads(count);
    }
  }, []);

  function updateThreadCount(value: number) {
    const next = Math.max(1, Math.min(4, Math.floor(value)));
    latencySamplesRef.current = [];
    setP95(0);
    setP99(0);
    void configureWasmThreads(next).then(setActiveThreads).catch((error) => {
      setStatus(error instanceof Error ? error.message : 'Unable to change WASM thread count');
    });
  }

  function updateThreshold(value: number) {
    const nextThreshold = clampThreshold(value);
    thresholdRef.current = nextThreshold;
    setThreshold(nextThreshold);
  }

  function setRoi(nextRoi: ROI) {
    const next = clampRoi(nextRoi);
    roiRef.current = next;
    setRoiState(next);
  }

  function updateResolutionPreset(next: ResolutionPreset) {
    resolutionPresetRef.current = next;
    setResolutionPreset(next);
  }

  function updateAdaptiveEnabled(enabled: boolean) {
    adaptiveEnabledRef.current = enabled;
    setAdaptiveEnabled(enabled);
    slowWindowsRef.current = 0;
    fastWindowsRef.current = 0;
  }

  useEffect(() => () => {
    stopAnalysis();
    sourceRequestRef.current++;
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  }, []);

  function stopAnalysis(statusText?: string) {
    runningRef.current = false;
    runIdRef.current++;
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }
    videoRef.current?.pause();
    setRunning(false);
    if (statusText) setStatus(statusText);
  }

  async function selectVideo(file?: File) {
    if (!file || !videoRef.current) return;

    const requestId = ++sourceRequestRef.current;
    stopAnalysis();
    setSourceReady(false);
    setStatus('Loading video metadata');

    const video = videoRef.current;
    video.pause();
    video.removeAttribute('src');
    video.load();

    // A new video starts a fresh timeline; restarting same video preserves it.
    tracker.current.reset();
    setEvents([]);
    setMovingObjects([]);
    setProcessingSize({ width: 0, height: 0 });
    setMotion(0);
    setFps(0);
    setWasmLatency(0);
    setEndToEndLatency(0);
    setP95(0);
    setP99(0);
    setDroppedFrames(0);
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    const videoObjectUrl = URL.createObjectURL(file);
    videoObjectUrlRef.current = videoObjectUrl;
    try {
      const metadataPromise = new Promise<void>((resolve, reject) => {
        const onLoaded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Unable to load selected video.')); };
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('error', onError, { once: true });
      });
      video.src = videoObjectUrl;
      video.load();
      await metadataPromise;
      if (requestId !== sourceRequestRef.current) return;
      if (!video.videoWidth || !video.videoHeight) throw new Error('Video has no usable dimensions.');
      setSourceReady(true);
      setStatus('Video ready');
    } catch (error) {
      if (requestId !== sourceRequestRef.current) return;
      setStatus(error instanceof Error ? error.message : 'Unable to load selected video.');
    }
  }

  async function start() {
    if (runningRef.current) return;

    if (!sourceReady || !videoRef.current?.src) {
      setStatus('Select a video first');
      return;
    }

    const runId = ++runIdRef.current;
    const video = videoRef.current;

    // Stop can pause the video, so every new analysis run must resume playback.
    try {
      setStatus('Preparing motion engine');
      await resetWasm();
      if (runId !== runIdRef.current) return;
      await video.play();
    } catch {
      stopAnalysis('Unable to start motion engine or play video');
      setSourceReady(false);
      return;
    }

    if (runId !== runIdRef.current) return;

    setRunning(true);
    runningRef.current = true;

    const source = sourceRef.current;
    const output = outputRef.current;
    const ctx = source?.getContext('2d', { willReadFrequently: true });
    const out = output?.getContext('2d');
    if (!source || !output || !ctx || !out) {
      stopAnalysis('Canvas is unavailable');
      return;
    }

    const size = getProcessingSize(video.videoWidth, video.videoHeight, resolutionPresetRef.current);
    effectiveResolutionRef.current = resolutionPresetRef.current;
    setEffectiveResolutionPreset(resolutionPresetRef.current);
    source.width = output.width = size.width;
    source.height = output.height = size.height;
    setProcessingSize(size);
    setStatus('Analyzing');

    let last = performance.now();
    let frames = 0;
    let lastDroppedFrames = 0;
    latencySamplesRef.current = [];
    setP95(0);
    setP99(0);

    const loop = async () => {
      if (!runningRef.current || runId !== runIdRef.current) return;

      // Hidden source canvas provides pixels; output canvas displays processed data.
      try {
        const frameStarted = performance.now();
        ctx.drawImage(video, 0, 0, source.width, source.height);
        const image = ctx.getImageData(0, 0, source.width, source.height);
        const wasmStarted = performance.now();
        const result = await processWithWasm(image, thresholdRef.current);
      if (!runningRef.current || runId !== runIdRef.current) return;
      const nextWasmLatency = performance.now() - wasmStarted;

      out.putImageData(result.processedData, 0, 0);
      // Normalize detected pixels against selected ROI area.
      const currentRoi = roiRef.current;
      setMovingObjects(detectMovingObjects(result.processedData, currentRoi, minObjectArea));
      const roiPixels = Math.max(1, currentRoi.width * currentRoi.height * image.width * image.height);
      const ratio = countPixelsInRoi(result.processedData, currentRoi) / roiPixels;
      const nextEndToEndLatency = performance.now() - frameStarted;
      const samples = latencySamplesRef.current;
      samples.push(nextEndToEndLatency);
      if (samples.length > maxLatencySamples) samples.shift();
      setP95(percentile(samples, 0.95));
      setP99(percentile(samples, 0.99));
      const event = tracker.current.update(video.currentTime, ratio, 0.02, nextWasmLatency, nextEndToEndLatency);

      // Tracker turns continuous motion into discrete timeline events.
      if (event) setEvents((current) => [event, ...current]);

      setMotion(Math.round(ratio * 10000) / 100);
      setWasmLatency(Math.round(nextWasmLatency * 100) / 100);
      setEndToEndLatency(Math.round(nextEndToEndLatency * 100) / 100);
      frames++;

      const now = performance.now();
      // Report FPS over one-second windows to avoid noisy per-frame values.
      if (now - last >= 1000) {
        const windowFps = (frames * 1000) / (now - last);
        setFps(windowFps);
        const quality = video.getVideoPlaybackQuality?.();
        const totalDroppedFrames = quality?.droppedVideoFrames ?? lastDroppedFrames;
        const windowDroppedFrames = Math.max(0, totalDroppedFrames - lastDroppedFrames);
        lastDroppedFrames = totalDroppedFrames;
        setDroppedFrames((current) => current + windowDroppedFrames);
        if (adaptiveEnabledRef.current && samples.length > 0) {
          const currentP95 = percentile(samples, 0.95);
          const maxIndex = resolutionOrder.indexOf(resolutionPresetRef.current);
          const currentIndex = resolutionOrder.indexOf(effectiveResolutionRef.current);
          let nextPreset = effectiveResolutionRef.current;
          const targetFps = 30;
           const overloaded = currentP95 > adaptiveAlpha * frameBudgetMs || windowFps < targetFps * 0.85 || windowDroppedFrames > 0;
           const healthy = currentP95 < adaptiveBeta * frameBudgetMs && windowFps >= targetFps * 0.95 && windowDroppedFrames === 0;
          if (overloaded) {
            slowWindowsRef.current++;
            fastWindowsRef.current = 0;
            if (slowWindowsRef.current >= downshiftHoldWindows && currentIndex > 0) {
              nextPreset = resolutionOrder[currentIndex - 1];
              slowWindowsRef.current = 0;
            }
          } else if (healthy) {
            fastWindowsRef.current++;
            slowWindowsRef.current = 0;
            if (fastWindowsRef.current >= upshiftHoldWindows && currentIndex < maxIndex) {
              nextPreset = resolutionOrder[currentIndex + 1];
              fastWindowsRef.current = 0;
            }
          } else {
            slowWindowsRef.current = 0;
            fastWindowsRef.current = 0;
          }
          if (nextPreset !== effectiveResolutionRef.current) {
            effectiveResolutionRef.current = nextPreset;
            setEffectiveResolutionPreset(nextPreset);
            const nextSize = getProcessingSize(video.videoWidth, video.videoHeight, nextPreset);
            source.width = output.width = nextSize.width;
            source.height = output.height = nextSize.height;
            setProcessingSize(nextSize);
            latencySamplesRef.current = [];
            setP95(0);
            setP99(0);
            await resetWasm();
          }
        }
        frames = 0;
        last = now;
      }

        frameRequestRef.current = requestAnimationFrame(() => void loop());
      } catch (error) {
        if (runningRef.current && runId === runIdRef.current) stopAnalysis(error instanceof Error ? error.message : 'Frame processing failed');
      }
    };

    void loop();
  }

  function stop() {
    stopAnalysis('Stopped');
  }

  function exportEventsJson() { downloadTextFile(createEventJson(events), `motionguard-events-${Date.now()}.json`, 'application/json;charset=utf-8'); }
  function exportEventsCsv() { downloadTextFile(createEventCsv(events), `motionguard-events-${Date.now()}.csv`, 'text/csv;charset=utf-8'); }

  return {
    videoRef,
    sourceRef,
    outputRef,
    status,
    running,
    sourceReady,
    threshold,
    resolutionPreset,
    setResolutionPreset: updateResolutionPreset,
    processingSize,
    adaptiveEnabled,
    effectiveResolutionPreset,
    setAdaptiveEnabled: updateAdaptiveEnabled,
    setThreshold: updateThreshold,
    roi,
    setRoi,
    fps,
    wasmLatency,
    endToEndLatency,
    p95,
    p99,
    droppedFrames,
    motion,
    events,
    movingObjects,
    browserStatus,
    runtimeStatus,
    activeThreads,
    setThreadCount: updateThreadCount,
    selectVideo,
    start,
    stop,
    exportEventsJson,
    exportEventsCsv,
  };
}
