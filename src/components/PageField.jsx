import { useRef, useEffect } from 'react';

export function PageInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-transparent border-0 border-b border-dashed border-transparent focus:border-maroon/40 outline-none placeholder:text-ink/30 placeholder:italic ${className}`}
    />
  );
}

export function PageTextarea({ className = '', value, ...props }) {
  const ref = useRef(null);

  // Auto-grow to fit content instead of showing an internal scrollbar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      {...props}
      className={`w-full bg-transparent border-0 border-b border-dashed border-transparent focus:border-maroon/40 outline-none resize-none overflow-hidden leading-relaxed placeholder:text-ink/30 placeholder:italic ${className}`}
    />
  );
}

export function SectionHeading({ children }) {
  return (
    <div className="font-display text-xl font-bold text-maroon-dark uppercase tracking-wide mb-4 mt-10 first:mt-0 border-b-2 border-maroon/30 pb-2">
      {children}
    </div>
  );
}
