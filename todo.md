# MotionGuard Web TODO

Updated: 2026-08-27

## Research Questions

- RQ1: Can WebAssembly SIMD combined with pthreads achieve real-time 1080p throughput and adaptive 4K processing?
- RQ2: How do Workers, OffscreenCanvas, and copy reduction affect P95/P99 latency, dropped frames, and UI responsiveness?
- RQ3: Can adaptive scaling, sampling, and ROI maintain the 33.3 ms/frame budget better than fixed quality?
- RQ4: Can connected components, tracking, and event rules produce accurate timelines against ground truth?

## Current Status

- Done: React/Vite/TypeScript app, Tailwind, COOP/COEP headers.
- Done: MP4 upload, hidden source canvas, output canvas, WASM bridge, detector reset.
- Done: C++ integer grayscale, separable blur, SIMD differencing, four pthread workers.
- Done: Static ROI, threshold input, FPS/latency/motion telemetry, basic event timeline.
- Missing: Camera input, editable ROI, robust threshold clamping.
- Missing: P95/P99, dropped frames, memory, browser API status.
- Missing: Connected components, bbox, centroid, intensity, tracking, richer event schema.
- Missing: JSON/CSV export, adaptive quality, Worker/OffscreenCanvas comparison.
- Missing: Benchmark harness, ground truth, accuracy metrics, automated tests.

## Next Steps

### 1. Stabilize MVP

- [ ] Clamp threshold in state to 1-255, not only through HTML input attributes.
- [ ] Revoke previous video object URL when selecting another file.
- [ ] Run `npm run build`.

### 2. Add Camera Input

- [ ] Add camera start/stop controls.
- [ ] Use `navigator.mediaDevices.getUserMedia({ video: true })`.
- [ ] Stop camera tracks when switching source or unmounting.
- [ ] Preserve local-first behavior: never upload video or frames.
- [ ] Validate in Chrome and Edge.

### 3. Add Editable ROI

- [ ] Keep ROI normalized as `{ x, y, width, height }`, clamped to 0-1.
- [ ] Add drag-to-move and resize handle in `VideoStage`.
- [ ] Keep ROI state/calculations in hook or `src/features/roi.ts`.
- [ ] Confirm motion percentage changes when ROI includes/excludes movement.

### 4. Improve Telemetry

- [ ] Track bounded rolling frame-latency samples.
- [ ] Compute FPS, latest latency, P95, P99, dropped frames, and 33.3 ms budget status.
- [ ] Show `crossOriginIsolated`, `SharedArrayBuffer`, WebAssembly, camera, and OffscreenCanvas status.
- [ ] Show memory only when browser exposes a usable API.

### 5. Detect Moving Objects

- [ ] Keep WASM motion mask as baseline.
- [ ] Add TypeScript connected-components pass over mask for correctness first.
- [ ] Compute bbox, centroid, area, mean intensity, and max intensity.
- [ ] Filter noise by minimum area and ROI intersection.
- [ ] Render bbox and centroid overlays.
- [ ] Validate with simple/synthetic videos before optimization.

### 6. Track Objects and Events

- [ ] Match blobs between frames by centroid distance and area similarity.
- [ ] Assign stable `trackId` values.
- [ ] Add hysteresis: N frames to start, M quiet frames to end.
- [ ] Extend events with `id`, `start`, `end`, `duration`, `bbox`, `centroid`, `area`, `peakRatio`, `roiId`, `trackId`, `meanIntensity`, and `maxIntensity`.
- [ ] Preserve required behavior: prepend events, preserve events across stop/start, reset on new video.

### 7. Export Metadata

- [ ] Add JSON and CSV export controls near timeline.
- [ ] Export metadata only, never raw video or pixels.
- [ ] Validate output against event schema in `AGENTS.md`.

### 8. Benchmark Baseline

- [ ] Prepare/document 720p, 1080p, and 4K test clips.
- [ ] Add repeatable benchmark mode recording resolution, browser, hardware, threshold, ROI, FPS, average/P95/P99 latency, and dropped frames.
- [ ] Save results as JSON/CSV in a documented results path.
- [ ] Use main-thread Canvas + WASM as RQ1 baseline.

### 9. Add Adaptive Quality

- [ ] Reduce scale or sample frames when rolling P95 exceeds 33.3 ms.
- [ ] Restore quality gradually below budget.
- [ ] Display current quality mode.
- [ ] Compare fixed versus adaptive quality for RQ3.

### 10. Evaluate Worker Path

- [ ] Test Worker/OffscreenCanvas only after baseline metrics exist.
- [ ] Keep main-thread Canvas fallback working.
- [ ] Compare P95/P99, dropped frames, and UI responsiveness for RQ2.
- [ ] Keep worker path only if measurements justify complexity.

### 11. Accuracy and Documentation

- [ ] Label ground-truth event times and regions for selected clips.
- [ ] Calculate precision, recall, and event-overlap metrics for RQ4.
- [ ] Update README with setup, usage, camera permissions, privacy, browser support, and benchmark method.
- [ ] Document architecture and add result charts/tables.
- [ ] Prepare demo covering upload, camera, ROI, events, export, adaptive mode, and benchmarks.

## Validation Rules

- TypeScript/UI/config change: `npm run build`.
- C++ WASM change: `npm run build:wasm`, then `npm run build`.
- Verify upload, mask, FPS, latency, ROI motion, and events.
- Verify stop/start preserves events and resumes playback.
- Verify new video resets events.
- Verify camera tracks stop and export contains metadata only.
- Check desktop and widths below 800px.

## Constraints

- Do not edit generated files under `public/wasm` manually.
- Do not add backend upload or server-side frame handling.
- Defer WebGPU, deep learning, polygon ROI, heatmap, PDF export, and WebCodecs.
- Measure end-to-end latency, not only WASM core time.
