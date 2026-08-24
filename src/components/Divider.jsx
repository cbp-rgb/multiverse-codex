export default function Divider({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-[4px]" style={{ background: 'linear-gradient(to right, transparent, #9e1b2e)' }} />
      <div className="w-[9px] h-[9px] bg-maroon rotate-45 flex-shrink-0" />
      <div className="flex-1 h-[4px]" style={{ background: 'linear-gradient(to left, transparent, #9e1b2e)' }} />
    </div>
  );
}
