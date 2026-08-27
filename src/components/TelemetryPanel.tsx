import { Metric } from './Metric';

type TelemetryPanelProps = { fps: number; latency: number; motion: number };

export function TelemetryPanel({ fps, latency, motion }: TelemetryPanelProps) {
  return <aside className="border border-[#d7e1dc] p-5">
    <div className="mb-4.5 font-mono text-[11px] tracking-[0.14em] text-[#587168]">LIVE TELEMETRY</div>
    <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
      <Metric label="FPS" value={fps.toFixed(1)} unit="fps" />
      <Metric label="Frame latency" value={latency.toFixed(2)} unit="ms" />
      <Metric label="Motion in ROI" value={motion.toFixed(2)} unit="%" />
    </div>
  </aside>;
}
