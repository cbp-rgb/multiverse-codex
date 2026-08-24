export default function Divider({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(158,27,46,0.5))' }} />
      <div className="w-[5px] h-[5px] bg-gold rotate-45 flex-shrink-0 opacity-70" />
      <div className="flex-1 h-[3px]" style={{ background: 'linear-gradient(to right, #9e1b2e, transparent, #9e1b2e)' }} />
      <div className="w-[10px] h-[10px] border border-maroon rotate-45 flex-shrink-0 flex items-center justify-center flex-none">
        <div className="w-[4px] h-[4px] bg-maroon rotate-45" />
      </div>
      <div className="flex-1 h-[3px]" style={{ background: 'linear-gradient(to left, #9e1b2e, transparent, #9e1b2e)' }} />
      <div className="w-[5px] h-[5px] bg-gold rotate-45 flex-shrink-0 opacity-70" />
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(158,27,46,0.5))' }} />
    </div>
  );
}
