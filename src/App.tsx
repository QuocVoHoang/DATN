import { AppHeader } from './components/AppHeader';
import { TelemetryPanel } from './components/TelemetryPanel';
import { Toolbar } from './components/Toolbar';
import { VideoStage } from './components/VideoStage';
import { useMotionAnalysis } from './hooks/useMotionAnalysis';

export default function App() {
  const motion = useMotionAnalysis();

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] bg-[#f7faf8] p-5 font-sans text-[#18231f]">
      <AppHeader
        running={motion.running}
        status={motion.status}
      />

      <Toolbar
        running={motion.running}
        threshold={motion.threshold}
        onThresholdChange={motion.setThreshold}
        onSelectVideo={motion.selectVideo}
        onStart={motion.start}
        onStop={motion.stop}
      />

      <section className="grid grid-cols-[minmax(0,1fr)_285px] gap-[18px] max-[800px]:grid-cols-1">
        <VideoStage
          videoRef={motion.videoRef}
          sourceRef={motion.sourceRef}
          outputRef={motion.outputRef}
          roi={motion.roi}
        />

        <TelemetryPanel
          fps={motion.fps}
          latency={motion.latency}
          motion={motion.motion}
          events={motion.events}
        />
      </section>
      <footer className="mt-[30px] flex justify-between font-mono text-[11px] tracking-[0.16em] text-[#587168] max-[800px]:block">
        LOCAL-FIRST VIDEO ANALYTICS
        <span className="max-[800px]:mt-2 max-[800px]:block">WASM SIMD · PTHREADS · ROI DETECTION</span>
      </footer>
    </main>
  );
}
