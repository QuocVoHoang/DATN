import { useEffect, useRef, useState } from 'react';
import { processWithWasm, resetWasm } from '../engine/wasmMotion';
import { countPixelsInRoi, type ROI } from '../features/roi';
import { MotionEventTracker, type MotionEvent } from '../features/motionEvents';

const defaultRoi: ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };

export function useMotionAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
  const tracker = useRef(new MotionEventTracker());

  const [status, setStatus] = useState('No video selected');
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(30);
  const [roi] = useState(defaultRoi);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [motion, setMotion] = useState(0);
  const [events, setEvents] = useState<MotionEvent[]>([]);

  useEffect(() => () => {
    // Stop pending frame work and release the browser-owned video URL.
    runningRef.current = false;
    runIdRef.current++;
    URL.revokeObjectURL(videoRef.current?.src || '');
  }, []);

  async function selectVideo(file?: File) {
    if (!file || !videoRef.current) return;

    // A new video starts a fresh timeline; restarting same video preserves it.
    tracker.current.reset();
    setEvents([]);
    videoRef.current.src = URL.createObjectURL(file);
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
    setStatus('Analyzing with WASM SIMD + 4 threads');

    let last = performance.now();
    let frames = 0;

    const loop = async () => {
      if (!runningRef.current || runId !== runIdRef.current) return;

      // Hidden source canvas provides pixels; output canvas displays processed data.
      ctx.drawImage(video, 0, 0, source.width, source.height);
      const image = ctx.getImageData(0, 0, source.width, source.height);
      const started = performance.now();
      const result = await processWithWasm(image, threshold);
      if (!runningRef.current || runId !== runIdRef.current) return;
      const elapsed = performance.now() - started;

      out.putImageData(result.processedData, 0, 0);

      // Normalize detected pixels against selected ROI area.
      const roiPixels = Math.max(1, roi.width * roi.height * image.width * image.height);
      const ratio = countPixelsInRoi(result.processedData, roi) / roiPixels;
      const event = tracker.current.update(video.currentTime, ratio, 0.02);

      // Tracker turns continuous motion into discrete timeline events.
      if (event) setEvents((current) => [event, ...current]);

      setMotion(Math.round(ratio * 10000) / 100);
      setLatency(Math.round(elapsed * 100) / 100);
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
    setThreshold,
    roi,
    fps,
    latency,
    motion,
    events,
    selectVideo,
    start,
    stop,
  };
}
