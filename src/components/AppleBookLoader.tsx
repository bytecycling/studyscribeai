/**
 * Smooth infinite-loop learning animation:
 *   🌱 seed drops from above
 *   sprouts into a growing trunk + canopy
 *   apples appear on the tree
 *   apples drop down
 *   one apple becomes the next seed → loop
 *
 * Pure CSS keyframes — no extra deps. ~160x120px.
 */
const AppleBookLoader = () => {
  // Loop duration (must match every animation-duration below)
  const D = "5s";

  return (
    <div
      className="relative w-40 h-32 select-none mx-auto"
      aria-hidden="true"
      style={{ ["--loop" as any]: D }}
    >
      <style>{`
        /* Seed falls in (0–15%), then hides while tree grows */
        @keyframes lb-seed {
          0%   { transform: translate(-50%, -180%) scale(1); opacity: 0; }
          6%   { opacity: 1; }
          15%  { transform: translate(-50%, 0%) scale(1); opacity: 1; }
          18%  { transform: translate(-50%, 0%) scale(0.6); opacity: 0; }
          100% { transform: translate(-50%, 0%) scale(0.6); opacity: 0; }
        }

        /* Trunk grows from ground (15–35%), stays, then fades out at end */
        @keyframes lb-trunk {
          0%, 15%   { transform: scaleY(0); opacity: 0; }
          22%       { opacity: 1; }
          35%, 88%  { transform: scaleY(1); opacity: 1; }
          96%, 100% { transform: scaleY(1); opacity: 0; }
        }

        /* Canopy pops in after trunk, gentle breathing while apples grow */
        @keyframes lb-canopy {
          0%, 30%   { transform: translate(-50%, 0) scale(0); opacity: 0; }
          42%       { transform: translate(-50%, 0) scale(1.15); opacity: 1; }
          50%, 86%  { transform: translate(-50%, 0) scale(1); opacity: 1; }
          96%, 100% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
        }

        /* Apples appear on canopy, then fall */
        @keyframes lb-apple-grow {
          0%, 50%   { transform: translate(-50%, 0) scale(0); opacity: 0; }
          58%       { transform: translate(-50%, 0) scale(1); opacity: 1; }
          70%       { transform: translate(-50%, 0) scale(1); opacity: 1; }
          /* fall */
          85%       { transform: translate(-50%, 60px) scale(0.9); opacity: 1; }
          92%       { transform: translate(-50%, 70px) scale(0.6); opacity: 0; }
          100%      { transform: translate(-50%, 70px) scale(0.6); opacity: 0; }
        }

        /* Ground line subtle pulse on landing */
        @keyframes lb-ground {
          0%, 82%   { transform: scaleX(1); opacity: 0.5; }
          88%       { transform: scaleX(1.15); opacity: 0.9; }
          94%, 100% { transform: scaleX(1); opacity: 0.5; }
        }

        .lb-seed   { animation: lb-seed   var(--loop) cubic-bezier(.45,.05,.55,.95) infinite; }
        .lb-trunk  { animation: lb-trunk  var(--loop) ease-out infinite; transform-origin: bottom center; }
        .lb-canopy { animation: lb-canopy var(--loop) cubic-bezier(.34,1.56,.64,1) infinite; transform-origin: bottom center; }
        .lb-apple  { animation: lb-apple-grow var(--loop) cubic-bezier(.55,.05,.7,.95) infinite; }
        .lb-ground { animation: lb-ground var(--loop) ease-in-out infinite; transform-origin: center; }
      `}</style>

      {/* Ground line */}
      <div
        className="lb-ground absolute left-1/2 -translate-x-1/2 bottom-2 h-px w-24 bg-primary/40 rounded-full"
      />

      {/* Trunk (grows from bottom) */}
      <div
        className="lb-trunk absolute left-1/2 -translate-x-1/2 bottom-2 w-1.5 h-14 rounded-full"
        style={{ background: "linear-gradient(to top, hsl(25 45% 35%), hsl(25 55% 45%))" }}
      />

      {/* Canopy */}
      <div className="lb-canopy absolute left-1/2 bottom-12 w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="40" r="26" fill="hsl(140 55% 40%)" opacity="0.95" />
          <circle cx="24" cy="38" r="18" fill="hsl(140 60% 45%)" opacity="0.9" />
          <circle cx="56" cy="38" r="18" fill="hsl(140 60% 45%)" opacity="0.9" />
          <circle cx="40" cy="22" r="18" fill="hsl(140 65% 50%)" opacity="0.95" />
        </svg>
      </div>

      {/* Apples on the canopy (3 positions, slightly staggered) */}
      <Apple className="lb-apple absolute" style={{ left: "32%", bottom: "70px" }} />
      <Apple className="lb-apple absolute" style={{ left: "50%", bottom: "78px", animationDelay: "0.15s" }} />
      <Apple className="lb-apple absolute" style={{ left: "68%", bottom: "70px", animationDelay: "0.3s" }} />

      {/* Falling seed */}
      <div className="lb-seed absolute top-0 left-1/2 w-3 h-4">
        <svg viewBox="0 0 12 16" className="w-full h-full">
          <ellipse cx="6" cy="10" rx="4" ry="5" fill="hsl(35 70% 45%)" />
          <path d="M6 6 C 6 3, 8 2, 10 2" stroke="hsl(140 65% 40%)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

const Apple = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={className} style={{ width: 14, height: 14, ...style }}>
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        d="M12 7c-2-3-7-2-7 3 0 4 3 9 7 9s7-5 7-9c0-5-5-6-7-3Z"
        fill="#ef4444"
      />
      <path d="M12 7c0-2 1-3 2.5-3" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <ellipse cx="9" cy="11" rx="1.2" ry="0.8" fill="#fff" opacity="0.45" />
    </svg>
  </div>
);

export default AppleBookLoader;
