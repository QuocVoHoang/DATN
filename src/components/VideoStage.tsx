import type { RefObject } from 'react';
import type { ROI } from '../features/roi';

type VideoStageProps = { videoRef: RefObject<HTMLVideoElement | null>; sourceRef: RefObject<HTMLCanvasElement | null>; outputRef: RefObject<HTMLCanvasElement | null>; roi: ROI };

export function VideoStage({ videoRef, sourceRef, outputRef, roi }: VideoStageProps) {
  return (
    <div className="stage">
      <video ref={videoRef} muted loop playsInline />
      <canvas ref={outputRef} />
      <div 
        className="roi" 
        style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.width * 100}%`, height: `${roi.height * 100}%` }}
      >
        <span>ROI · REGION OF INTEREST</span>
      </div>
      <canvas ref={sourceRef} className="hidden" />
    </div>
  );
}
