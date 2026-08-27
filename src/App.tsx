import { useEffect, useRef, useState } from 'react';
import { processWithWasm, resetWasm } from './engine/wasmMotion';
import { countPixelsInRoi, type ROI } from './features/roi';
import { MotionEventTracker, type MotionEvent } from './features/motionEvents';

const defaultRoi: ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);

  const runningRef = useRef(false);
  const tracker = useRef(new MotionEventTracker());

  const [status, setStatus] = useState('No video selected');
  const [running, setRunning] = useState(false);

  const [threshold, setThreshold] = useState(30);
  const [roi, setRoi] = useState(defaultRoi);

  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [motion, setMotion] = useState(0);
  const [events, setEvents] = useState<MotionEvent[]>([]);

  useEffect(
    () => () => {
      runningRef.current = false;
      URL.revokeObjectURL(videoRef.current?.src || "");
    },
    [],
  );

  async function selectVideo(file?: File) {
    if (!file || !videoRef.current) return;

    videoRef.current.src = URL.createObjectURL(file);

    await videoRef.current.play().catch(() => undefined);

    setStatus("Video ready");
  }

  async function start() {
    if (!videoRef.current?.src) {
      return setStatus("Select a video first");
    }

    setRunning(true);
    runningRef.current = true;
    tracker.current.reset();
    setEvents([]);

    await resetWasm();

    const video = videoRef.current;
    const source = sourceRef.current!;
    const output = outputRef.current!;

    const ctx = source.getContext("2d", {
      willReadFrequently: true,
    })!;

    const out = output.getContext("2d")!;

    source.width = output.width = video.videoWidth;
    source.height = output.height = video.videoHeight;

    setStatus("Analyzing with WASM SIMD + 4 threads");

    let last = performance.now();
    let frames = 0;

    const loop = async () => {
      if (!runningRef.current) return;

      ctx.drawImage(video, 0, 0, source.width, source.height);

      const image = ctx.getImageData(
        0,
        0,
        source.width,
        source.height,
      );

      const started = performance.now();

      const result = await processWithWasm(
        image,
        threshold,
      );

      const elapsed = performance.now() - started;

      out.putImageData(result.processedData, 0, 0);

      const roiPixels = Math.max(
        1,
        roi.width *
        roi.height *
        image.width *
        image.height,
      );

      const ratio =
        countPixelsInRoi(result.processedData, roi) / roiPixels;

      const event = tracker.current.update(
        video.currentTime,
        ratio,
        0.02,
      );

      if (event) {
        setEvents((current) => [event, ...current]);
      }

      setMotion(Math.round(ratio * 10000) / 100);
      setLatency(Math.round(elapsed * 100) / 100);

      frames++;

      const now = performance.now();

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
    setRunning(false);
    videoRef.current?.pause();
    setStatus('Stopped');
  }

  return <main>
    <header>
      <div>
        <span className="eyebrow">MOTIONGUARD WEB</span>

        <h1>
          Motion analysis
          <br />
          <em>directly in your browser.</em>
        </h1>

        <p className="lede">
          Video never leaves your device. The processing core uses WebAssembly
          SIMD and multithreading.
        </p>
      </div>

      <div className="status">
        <span className={running ? "dot live" : "dot"} />
        {status}
      </div>
    </header>

    <section className="toolbar">
      <label className="upload">
        Choose video
        <input
          type="file"
          accept="video/mp4,video/*"
          onChange={(e) => void selectVideo(e.target.files?.[0])}
        />
      </label>

      <button onClick={() => void start()} disabled={running}>
        Start
      </button>

      <button className="secondary" onClick={stop} disabled={!running}>
        Stop
      </button>

      <label>
        Threshold
        <input
          className="number"
          type="number"
          min="1"
          max="255"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </label>
    </section>

    <section className="workspace">
      <div className="stage">
        <video ref={videoRef} muted loop playsInline />

        <canvas ref={outputRef} />

        <div
          className="roi"
          style={{
            left: `${roi.x * 100}%`,
            top: `${roi.y * 100}%`,
            width: `${roi.width * 100}%`,
            height: `${roi.height * 100}%`,
          }}
        >
          <span>ROI · REGION OF INTEREST</span>
        </div>

        <canvas ref={sourceRef} className="hidden" />
      </div>

      <aside>
        <div className="panel-title">LIVE TELEMETRY</div>

        <Metric
          label="Processing FPS"
          value={fps.toFixed(1)}
          unit="fps"
        />

        <Metric
          label="Frame latency"
          value={latency.toFixed(2)}
          unit="ms"
        />

        <Metric
          label="Motion in ROI"
          value={motion.toFixed(2)}
          unit="%"
        />

        <div className="panel-title events-title">EVENT TIMELINE</div>

        <div className="events-list">
          {events.length === 0 ? (
            <p className="empty">No events recorded yet.</p>
          ) : (
            events.map((event, i) => (
              <div
                className="event"
                key={`${event.startedAt}-${i}`}
              >
                <b>Motion event #{i + 1}</b>

                <span>
                  {event.startedAt.toFixed(1)}s → {event.endedAt.toFixed(1)}s · peak{" "}
                  {(event.peakRatio * 100).toFixed(2)}%
                </span>
              </div>
            ))
          )}
        </div>

      </aside>
    </section>

    <footer>
      LOCAL-FIRST VIDEO ANALYTICS
      <span>WASM SIMD · PTHREADS · ROI DETECTION</span>
    </footer>
  </main>
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value} <small>{unit}</small>
      </strong>
    </div>
  )
}
