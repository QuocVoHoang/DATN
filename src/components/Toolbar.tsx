type ToolbarProps = {
  running: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onSelectVideo: (file?: File) => void;
  onStart: () => void;
  onStop: () => void;
};

export function Toolbar({ running, threshold, onThresholdChange, onSelectVideo, onStart, onStop }: ToolbarProps) {
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
    </section>
  );
}
