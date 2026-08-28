import type { ResolutionPreset } from '../hooks/useMotionAnalysis';

type ToolbarProps = {
  running: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onSelectVideo: (file?: File) => void;
  onStart: () => void;
  onStop: () => void;
  resolutionPreset: ResolutionPreset;
  onResolutionChange: (value: ResolutionPreset) => void;
  adaptiveEnabled: boolean;
  adaptiveAlpha: number;
  adaptiveBeta: number;
  onAdaptiveEnabledChange: (value: boolean) => void;
  onAdaptiveAlphaChange: (value: number) => void;
  onAdaptiveBetaChange: (value: number) => void;
};

export function Toolbar({ running, threshold, onThresholdChange, onSelectVideo, onStart, onStop, resolutionPreset, onResolutionChange, adaptiveEnabled, adaptiveAlpha, adaptiveBeta, onAdaptiveEnabledChange, onAdaptiveAlphaChange, onAdaptiveBetaChange }: ToolbarProps) {
  const actionClass = 'cursor-pointer rounded border border-[#70927f] px-[18px] py-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-35';
  return (
    <section className="flex flex-wrap items-center gap-3 py-5">
      <label className={`${actionClass} bg-[#8bd66d] text-[#132018]`}>
        Choose video
        <input
          className="hidden"
          type="file"
          accept="video/mp4,video/*"
          onChange={(e) => void onSelectVideo(e.target.files?.[0])}
        />
      </label>
      <button
        className={`${actionClass} bg-[#8bd66d] text-[#132018]`}
        onClick={() => void onStart()}
        disabled={running}
      >
        Start
      </button>
      <button
        className={`${actionClass} bg-transparent text-[#294238]`}
        onClick={onStop}
        disabled={!running}
      >
        Stop
      </button>
      <label className="ml-auto font-mono text-xs text-[#60736c] max-sm:ml-0">
        Processing resolution
        <select className="ml-2 border border-[#bdccc5] bg-white p-2.5 text-[#18231f]" value={resolutionPreset} onChange={(e) => onResolutionChange(e.target.value as ResolutionPreset)} disabled={running}>
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
          <option value="2k">2K</option>
          <option value="4k">4K</option>
        </select>
      </label>
      <label className="font-mono text-xs text-[#60736c]">
        Threshold
        <input
          className="ml-2 w-16.25 border border-[#bdccc5] bg-white p-2.5 text-[#18231f]"
          type="number"
          min="1"
          max="255"
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
        />
      </label>
      <label className="font-mono text-xs text-[#60736c]">
        <input type="checkbox" className="mr-2" checked={adaptiveEnabled} onChange={(e) => onAdaptiveEnabledChange(e.target.checked)} />
        Adaptive quality
      </label>
      <label className="font-mono text-xs text-[#60736c]">Alpha
        <input className="ml-2 w-14 border border-[#bdccc5] bg-white p-2.5" type="number" min="1" max="2" step="0.05" value={adaptiveAlpha} onChange={(e) => onAdaptiveAlphaChange(Number(e.target.value))} />
      </label>
      <label className="font-mono text-xs text-[#60736c]">Beta
        <input className="ml-2 w-14 border border-[#bdccc5] bg-white p-2.5" type="number" min="0.4" max="1" step="0.05" value={adaptiveBeta} onChange={(e) => onAdaptiveBetaChange(Number(e.target.value))} />
      </label>
    </section>
  );
}
