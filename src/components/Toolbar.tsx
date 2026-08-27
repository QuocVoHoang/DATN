type ToolbarProps = {
  running: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onSelectVideo: (file?: File) => void;
  onStart: () => void;
  onStop: () => void;
};

export function Toolbar({ running, threshold, onThresholdChange, onSelectVideo, onStart, onStop }: ToolbarProps) {
  return (
    <section className="toolbar">
      <label className="upload">
        Choose video
        <input
          type="file"
          accept="video/mp4,video/*"
          onChange={(e) => void onSelectVideo(e.target.files?.[0])}
        />
      </label>
      <button
        onClick={() => void onStart()}
        disabled={running}
      >
        Start
      </button>
      <button
        className="secondary"
        onClick={onStop}
        disabled={!running}
      >
        Stop
      </button>
      <label>
        Threshold
        <input
          className="number"
          type="number"
          min="1"
          max="255"
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
        />
      </label>
    </section>
  );
}
