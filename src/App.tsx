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
            movingObjects={motion.movingObjects}
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
            resolutionPreset={motion.resolutionPreset}
            onResolutionChange={motion.setResolutionPreset}
            adaptiveEnabled={motion.adaptiveEnabled}
            adaptiveAlpha={motion.adaptiveAlpha}
            adaptiveBeta={motion.adaptiveBeta}
            onAdaptiveEnabledChange={motion.setAdaptiveEnabled}
            onAdaptiveAlphaChange={motion.setAdaptiveAlpha}
            onAdaptiveBetaChange={motion.setAdaptiveBeta}
          />

          <TelemetryPanel
            fps={motion.fps}
            wasmLatency={motion.wasmLatency}
            endToEndLatency={motion.endToEndLatency}
            p95={motion.p95}
            p99={motion.p99}
            motion={motion.motion}
            browserStatus={motion.browserStatus}
            runtimeStatus={motion.runtimeStatus}
            processingSize={motion.processingSize}
            adaptiveEnabled={motion.adaptiveEnabled}
            effectiveResolutionPreset={motion.effectiveResolutionPreset}
          />
        </div>
      </section>
      <div className="flex justify-center gap-5 max-[800px]:flex-col">
        <EventTimeline events={motion.events} />
      </div>
    </main>
  );
}
