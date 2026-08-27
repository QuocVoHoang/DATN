type AppHeaderProps = { running: boolean; status: string };

export function AppHeader({ running, status }: AppHeaderProps) {
  return (
    <header>
      <h1>Motion analysis<br /><em>directly in your browser.</em></h1>
      <div className="status"><span className={running ? 'dot live' : 'dot'} />{status}</div>
    </header>
  );
}
