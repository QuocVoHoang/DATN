import { AppHeader } from './components/AppHeader';
import { TelemetryPanel } from './components/TelemetryPanel';
import { Toolbar } from './components/Toolbar';
import { VideoStage } from './components/VideoStage';
import { useMotionAnalysis } from './hooks/useMotionAnalysis';

export default function App() {
  const motion = useMotionAnalysis();

  return (
    <main>
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

      <section className="workspace">
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
    </main>
  );
}
