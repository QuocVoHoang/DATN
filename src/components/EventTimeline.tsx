import type { MotionEvent } from '../features/motionEvents';

export function EventTimeline({ events }: { events: MotionEvent[] }) {
  return (
    <section className="mt-5 w-200 border border-[#d7e1dc] p-5">
      <div className="mb-4.5 font-mono text-[11px] tracking-[0.14em] text-[#587168]">EVENT TIMELINE</div>
      <div className="max-h-100 overflow-y-auto pr-1.5">
        {events.length === 0 ? <p className="text-[13px] text-[#65736f]">No events recorded yet.</p> : events.map((event, i) => (
          <div className="my-2.25 border-l-2 border-[#6ab94f] bg-[#eaf2ed] px-2.5 py-1.75 text-xs" key={`${event.startedAt}-${i}`}>
            <b>Motion event #{events.length - i}</b>
            <span className="mt-1 block font-mono text-[10px] text-[#60736c]">{event.startedAt.toFixed(1)}s → {event.endedAt.toFixed(1)}s · peak {(event.peakRatio * 100).toFixed(2)}%</span>
            <span className="block font-mono text-[10px] text-[#60736c]">WASM latency {event.peakWasmLatency.toFixed(2)} ms <br/> EtoE latency {event.peakEndToEndLatency.toFixed(2)} ms</span>
          </div>
        ))}
      </div>
    </section>
  );
}
