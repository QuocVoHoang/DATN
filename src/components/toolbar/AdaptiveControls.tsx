type Props = { enabled: boolean; alpha: number; beta: number; onEnabledChange: (value: boolean) => void; onAlphaChange: (value: number) => void; onBetaChange: (value: number) => void };

export function AdaptiveControls({ enabled, alpha, beta, onEnabledChange, onAlphaChange, onBetaChange }: Props) {
  return <>
    <label className="font-mono text-xs text-[#60736c]"><input type="checkbox" className="mr-2" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />Adaptive quality</label>
    <label className="font-mono text-xs text-[#60736c]">Alpha<input className="ml-2 w-14 border border-[#bdccc5] bg-white p-2.5" type="number" min="1" max="2" step="0.05" value={alpha} onChange={(e) => onAlphaChange(Number(e.target.value))} /></label>
    <label className="font-mono text-xs text-[#60736c]">Beta<input className="ml-2 w-14 border border-[#bdccc5] bg-white p-2.5" type="number" min="0.4" max="1" step="0.05" value={beta} onChange={(e) => onBetaChange(Number(e.target.value))} /></label>
  </>;
}
