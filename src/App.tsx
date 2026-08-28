import { AppHeader } from './components/AppHeader';
import { EventTimeline } from './components/EventTimeline';
import { TelemetryPanel } from './components/TelemetryPanel';
import { Toolbar } from './components/Toolbar';
import { VideoStage } from './components/VideoStage';
import { useMotionAnalysis } from './hooks/useMotionAnalysis';

export default function App() {
  const motion = useMotionAnalysis();

  return (
    <main className="mx-auto min-h-screen w-full px-5 bg-[#f7faf8] font-sans text-[#18231f]">
      <AppHeader
        running={motion.running}
        status={motion.status}
      />

      <section className="flex flex-row items-start gap-5 max-[800px]:flex-col">
        <div className="w-full flex-1">
          <VideoStage
            videoRef={motion.videoRef}
            sourceRef={motion.sourceRef}
            outputRef={motion.outputRef}
            roi={motion.roi}
            onRoiChange={motion.setRoi}
          />
        </div>

        <div className="w-full flex-1">
          <Toolbar
            running={motion.running}
            threshold={motion.threshold}
            onThresholdChange={motion.setThreshold}
            onSelectVideo={motion.selectVideo}
            onStart={motion.start}
            onStop={motion.stop}
          />

          <TelemetryPanel
            fps={motion.fps}
            latency={motion.latency}
            motion={motion.motion}
          />
        </div>
      </section>
      <div className="justify-center flex">
        <EventTimeline events={motion.events} />
      </div>
    </main>
  );
}
