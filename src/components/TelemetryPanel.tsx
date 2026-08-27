import type { MotionEvent } from '../features/motionEvents';
import { Metric } from './Metric';

type TelemetryPanelProps = { fps: number; latency: number; motion: number; events: MotionEvent[] };

export function TelemetryPanel({ fps, latency, motion, events }: TelemetryPanelProps) {
  return (
    <aside className="border border-[#d7e1dc] p-5">
      <div className="mb-[18px] font-mono text-[11px] tracking-[0.14em] text-[#587168]">LIVE TELEMETRY</div>
      <Metric label="Processing FPS" value={fps.toFixed(1)} unit="fps" />
      <Metric label="Frame latency" value={latency.toFixed(2)} unit="ms" />
      <Metric label="Motion in ROI" value={motion.toFixed(2)} unit="%" />
      <div className="mt-7 mb-[18px] font-mono text-[11px] tracking-[0.14em] text-[#587168]">EVENT TIMELINE</div>
      <div className="max-h-[200px] overflow-y-auto pr-1.5">
        {events.length === 0 ?
          <p className="text-[13px] text-[#65736f]">No events recorded yet.</p> :
          events.map((event, i) =>
            <div className="my-[9px] border-l-2 border-[#6ab94f] bg-[#eaf2ed] px-2.5 py-[7px] text-xs" key={`${event.startedAt}-${i}`}>
              <b>Motion event #{events.length - i}</b>
              <span className="mt-1 block font-mono text-[10px] text-[#60736c]">{event.startedAt.toFixed(1)}s → {event.endedAt.toFixed(1)}s · peak {(event.peakRatio * 100).toFixed(2)}%</span>
            </div>
          )}
      </div>
    </aside>
  );
}
