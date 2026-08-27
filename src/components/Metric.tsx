type MetricProps = { label: string; value: string; unit: string };

export function Metric({ label, value, unit }: MetricProps) {
  return <div className="metric"><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>;
}
