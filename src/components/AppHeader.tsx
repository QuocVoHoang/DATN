type AppHeaderProps = { running: boolean; status: string };

export function AppHeader({ running, status }: AppHeaderProps) {
  return <header>
    <div>
      <span className="eyebrow">MOTIONGUARD WEB</span>
      <h1>Motion analysis<br /><em>directly in your browser.</em></h1>
      <p className="lede">Video never leaves your device. The processing core uses WebAssembly SIMD and multithreading.</p>
    </div>
    <div className="status"><span className={running ? 'dot live' : 'dot'} />{status}</div>
  </header>;
}
