type AppHeaderProps = { running: boolean; status: string };

export function AppHeader({ running, status }: AppHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-[30px] border-b border-[#d7e1dc] max-[800px]:block">
      <h1 className="my-[22px] text-[clamp(40px,6vw,40px)] leading-[0.92] tracking-[-0.06em]">
        Motion analysis <em className="not-italic text-[#4c8f36]">in your browser.</em>
      </h1>
      <div className="font-mono text-xs text-[#4c8f36] max-[800px]:mt-[25px]">
        <span className={`mr-2 inline-block size-2 rounded-full ${running ? 'bg-[#8bd66d] shadow-[0_0_14px_#8bd66d]' : 'bg-[#a8b7b0]'}`} />
        {status}
      </div>
    </header>
  );
}
