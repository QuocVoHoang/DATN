import type { RefObject } from 'react';
import type { ROI } from '../features/roi';

type VideoStageProps = { videoRef: RefObject<HTMLVideoElement | null>; sourceRef: RefObject<HTMLCanvasElement | null>; outputRef: RefObject<HTMLCanvasElement | null>; roi: ROI };

export function VideoStage({ videoRef, sourceRef, outputRef, roi }: VideoStageProps) {
  return (
    <div className="relative grid w-200 place-items-center overflow-hidden bg-[#edf3ef]">
      <video ref={videoRef} className="hidden" muted loop playsInline />
      <canvas ref={outputRef} className="block h-auto w-full" />
      <div 
        className="pointer-events-none absolute border border-dashed border-[#6ab94f]" 
        style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.width * 100}%`, height: `${roi.height * 100}%` }}
      >
        <span className="absolute -top-5.5 -left-px whitespace-nowrap font-mono text-[10px] text-[#4c8f36]">ROI · REGION OF INTEREST</span>
      </div>
      <canvas ref={sourceRef} className="hidden" />
    </div>
  );
}
