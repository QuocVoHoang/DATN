import type { MotionEvent } from '../features/motionEvents';
import { Metric } from './Metric';

type TelemetryPanelProps = { fps: number; latency: number; motion: number; events: MotionEvent[] };

export function TelemetryPanel({ fps, latency, motion, events }: TelemetryPanelProps) {
  return <aside>
    <div className="panel-title">LIVE TELEMETRY</div>
    <Metric label="Processing FPS" value={fps.toFixed(1)} unit="fps" />
    <Metric label="Frame latency" value={latency.toFixed(2)} unit="ms" />
    <Metric label="Motion in ROI" value={motion.toFixed(2)} unit="%" />
    <div className="panel-title events-title">EVENT TIMELINE</div>
    <div className="events-list">{events.length === 0 ? <p className="empty">No events recorded yet.</p> : events.map((event, i) => <div className="event" key={`${event.startedAt}-${i}`}><b>Motion event #{i + 1}</b><span>{event.startedAt.toFixed(1)}s → {event.endedAt.toFixed(1)}s · peak {(event.peakRatio * 100).toFixed(2)}%</span></div>)}</div>
  </aside>;
}
