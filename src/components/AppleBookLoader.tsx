/**
 * Cute infinite-loop animation:
 *   🍎 falls from above onto an open Book (left)
 *   the book "eats" the apple (scale-down + fade)
 *   apple re-emerges and arcs over to a second Book (right)
 *   second book closes briefly then re-opens, loop restarts
 *
 * Pure CSS keyframes — no extra deps. Sized for the loader header (~96px tall).
 */
const AppleBookLoader = () => {
  return (
    <div className="relative w-40 h-24 select-none" aria-hidden="true">
      <style>{`
        @keyframes apple-fall {
          0%   { transform: translate(-50%, -120%) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          25%  { transform: translate(-180%, 30%) rotate(-15deg); }
          35%  { transform: translate(-180%, 30%) rotate(-15deg); opacity: 1; }
          45%  { transform: translate(-180%, 30%) rotate(-15deg) scale(0.4); opacity: 0; }
          55%  { transform: translate(-180%, 10%) rotate(0deg) scale(0.6); opacity: 0; }
          70%  { transform: translate(0%, -60%) rotate(180deg) scale(1); opacity: 1; }
          85%  { transform: translate(180%, 30%) rotate(360deg) scale(0.5); opacity: 0; }
          100% { transform: translate(180%, 30%) rotate(360deg) scale(0.5); opacity: 0; }
        }
        @keyframes book-left-chomp {
          0%, 35%   { transform: scaleY(1); }
          42%, 50%  { transform: scaleY(0.7); }
          58%, 100% { transform: scaleY(1); }
        }
        @keyframes book-right-chomp {
          0%, 75%   { transform: scaleY(1); }
          82%, 90%  { transform: scaleY(0.7); }
          95%, 100% { transform: scaleY(1); }
        }
        .ab-apple { animation: apple-fall 3.2s cubic-bezier(.45,.05,.55,.95) infinite; }
        .ab-book-l { animation: book-left-chomp 3.2s ease-in-out infinite; transform-origin: bottom center; }
        .ab-book-r { animation: book-right-chomp 3.2s ease-in-out infinite; transform-origin: bottom center; }
      `}</style>

      {/* Left book */}
      <svg
        className="ab-book-l absolute bottom-0 left-2"
        width="48" height="40" viewBox="0 0 48 40" fill="none"
      >
        <path d="M4 10 L24 14 L24 36 L4 32 Z" fill="hsl(var(--primary))" opacity="0.85"/>
        <path d="M44 10 L24 14 L24 36 L44 32 Z" fill="hsl(var(--primary))" opacity="0.65"/>
        <path d="M24 14 L24 36" stroke="hsl(var(--background))" strokeWidth="1.2"/>
      </svg>

      {/* Right book */}
      <svg
        className="ab-book-r absolute bottom-0 right-2"
        width="48" height="40" viewBox="0 0 48 40" fill="none"
      >
        <path d="M4 10 L24 14 L24 36 L4 32 Z" fill="hsl(var(--accent))" opacity="0.85"/>
        <path d="M44 10 L24 14 L24 36 L44 32 Z" fill="hsl(var(--accent))" opacity="0.65"/>
        <path d="M24 14 L24 36" stroke="hsl(var(--background))" strokeWidth="1.2"/>
      </svg>

      {/* Apple */}
      <div className="ab-apple absolute top-0 left-1/2 w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path
            d="M12 7c-2-3-7-2-7 3 0 4 3 9 7 9s7-5 7-9c0-5-5-6-7-3Z"
            fill="#ef4444"
          />
          <path d="M12 7c0-2 1-4 3-4" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <ellipse cx="9" cy="11" rx="1.4" ry="1" fill="#fff" opacity="0.45"/>
        </svg>
      </div>
    </div>
  );
};

export default AppleBookLoader;
