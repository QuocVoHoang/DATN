# RESEARCH QUESTIONS:
- RQ1: Can WebAssembly SIMD combined with pthreads achieve the throughput required for real-time 1080p video analysis and adaptive 4K processing?
- RQ2: How do Web Workers, OffscreenCanvas, and data-copy reduction strategies affect P95/P99 latency, dropped frames, and UI responsiveness?
- RQ3: Can an adaptive quality controller based on scaling, frame sampling, and ROI maintain the 33.3 ms/frame budget better than a fixed configuration?
- RQ4: Can connected components, simple tracking, and event rules generate event timelines with acceptable accuracy compared with ground truth?

# 


# TODO:
1. Standardize the WebAssembly SIMD + pthreads build process and test the engine.
2. Design the architecture and interfaces between the capture, processing, event, and metrics modules.
3. Complete video upload, camera mode, and basic overlay rendering.
4. Integrate the motion engine and buffer reuse mechanism, and measure the baseline performance.
5. Implement the ROI editor, threshold settings, and processing parameters.
6. Implement the motion mask, noise filtering, and connected-component analysis.
7. Implement bounding boxes, centroids, simple tracking, and event rules.
8. Integrate Worker/OffscreenCanvas if feasible, while maintaining a stable Canvas fallback.
9. Implement the metrics dashboard, timeline, and JSON/CSV export.
10. Implement adaptive quality based on latency, FPS, and dropped frames.
11. Create ground-truth data, run performance benchmarks, and evaluate accuracy.
12. Analyze the results and finalize the report, charts, and technical documentation.

