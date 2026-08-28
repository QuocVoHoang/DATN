import { useEffect, useRef, useState } from 'react';
import { processWithWasm, resetWasm } from '../engine/wasmMotion';
import { clampRoi, countPixelsInRoi, type ROI } from '../features/roi';
import { MotionEventTracker, type MotionEvent } from '../features/motionEvents';
import { detectMovingObjects, type MovingObject } from '../features/movingObjects';

const defaultRoi: ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const minThreshold = 1;
const maxThreshold = 255;
const maxLatencySamples = 180;
const minObjectArea = 40;

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
  const tracker = useRef(new MotionEventTracker());

  const [status, setStatus] = useState('No video selected');
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(30);
  const thresholdRef = useRef(threshold);
  const [roi, setRoiState] = useState(defaultRoi);
  const roiRef = useRef(roi);
  const [fps, setFps] = useState(0);
  const [wasmLatency, setWasmLatency] = useState(0);
  const [endToEndLatency, setEndToEndLatency] = useState(0);
  const [p95, setP95] = useState(0);
  const [p99, setP99] = useState(0);
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
  };
  const latencySamplesRef = useRef<number[]>([]);

  useEffect(() => {
    setBrowserStatus({
      crossOriginIsolated: globalThis.crossOriginIsolated === true,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined',
      camera: Boolean(navigator.mediaDevices?.getUserMedia),
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    });
  }, []);

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

  useEffect(() => () => {
    // Stop pending frame work and release the browser-owned video URL.
    runningRef.current = false;
    runIdRef.current++;
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  }, []);

  async function selectVideo(file?: File) {
    if (!file || !videoRef.current) return;

    // A new video starts a fresh timeline; restarting same video preserves it.
    tracker.current.reset();
    setEvents([]);
    setMovingObjects([]);
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }

    const videoObjectUrl = URL.createObjectURL(file);
    videoObjectUrlRef.current = videoObjectUrl;
    videoRef.current.src = videoObjectUrl;
    await videoRef.current.play().catch(() => undefined);
    setStatus('Video ready');
  }

  async function start() {
    if (runningRef.current) return;

    if (!videoRef.current?.src) {
      setStatus('Select a video first');
      return;
    }

    const runId = ++runIdRef.current;
    const video = videoRef.current;

    // Stop can pause the video, so every new analysis run must resume playback.
    try {
      await video.play();
    } catch {
      setStatus('Unable to play video');
      return;
    }

    if (runId !== runIdRef.current) return;

    setRunning(true);
    runningRef.current = true;

    // Reset WASM state before starting a fresh frame-processing session.
    await resetWasm();

    const source = sourceRef.current!;
    const output = outputRef.current!;
    const ctx = source.getContext('2d', { willReadFrequently: true })!;
    const out = output.getContext('2d')!;

    source.width = output.width = video.videoWidth;
    source.height = output.height = video.videoHeight;
    setStatus('Analyzing');

    let last = performance.now();
    let frames = 0;
    latencySamplesRef.current = [];
    setP95(0);
    setP99(0);

    const loop = async () => {
      if (!runningRef.current || runId !== runIdRef.current) return;

      // Hidden source canvas provides pixels; output canvas displays processed data.
      ctx.drawImage(video, 0, 0, source.width, source.height);
      const frameStarted = performance.now();
      const image = ctx.getImageData(0, 0, source.width, source.height);
      const wasmStarted = performance.now();
      const result = await processWithWasm(image, thresholdRef.current);
      if (!runningRef.current || runId !== runIdRef.current) return;
      const nextWasmLatency = performance.now() - wasmStarted;

      out.putImageData(result.processedData, 0, 0);
      const nextEndToEndLatency = performance.now() - frameStarted;
      const samples = latencySamplesRef.current;
      samples.push(nextEndToEndLatency);
      if (samples.length > maxLatencySamples) samples.shift();
      setP95(percentile(samples, 0.95));
      setP99(percentile(samples, 0.99));

      // Normalize detected pixels against selected ROI area.
      const currentRoi = roiRef.current;
      setMovingObjects(detectMovingObjects(result.processedData, currentRoi, minObjectArea));
      const roiPixels = Math.max(1, currentRoi.width * currentRoi.height * image.width * image.height);
      const ratio = countPixelsInRoi(result.processedData, currentRoi) / roiPixels;
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
        setFps((frames * 1000) / (now - last));
        frames = 0;
        last = now;
      }

      requestAnimationFrame(() => void loop());
    };

    void loop();
  }

  function stop() {
    runningRef.current = false;
    runIdRef.current++;
    setRunning(false);
    videoRef.current?.pause();
    setStatus('Stopped');
  }

  return {
    videoRef,
    sourceRef,
    outputRef,
    status,
    running,
    threshold,
    setThreshold: updateThreshold,
    roi,
    setRoi,
    fps,
    wasmLatency,
    endToEndLatency,
    p95,
    p99,
    motion,
    events,
    movingObjects,
    browserStatus,
    runtimeStatus,
    selectVideo,
    start,
    stop,
  };
}
