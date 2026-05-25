/**
 * Infinite-loop learning animation:
 *   Tree stands with apples →
 *   trunk SPLITS down the middle (two halves tilt outward & fall) →
 *   apples drop into the soil as seeds →
 *   soil pulses, a sprout emerges →
 *   sprout grows into the next tree → loop.
 *
 * Pure CSS keyframes. ~160x130 footprint.
 */
const AppleBookLoader = () => {
  const D = "6s";

  return (
    <div
      className="relative w-40 h-32 select-none mx-auto"
      aria-hidden="true"
      style={{ ["--loop" as any]: D }}
    >
      <style>{`
        /* Sprout: 0-15% grows */
        @keyframes lb-sprout {
          0%        { transform: translate(-50%, 0) scaleY(0); opacity: 0; }
          4%        { opacity: 1; }
          15%       { transform: translate(-50%, 0) scaleY(1); opacity: 1; }
          22%, 100% { transform: translate(-50%, 0) scaleY(1); opacity: 0; }
        }

        /* Whole tree (trunk + canopy as one container): visible 18%-62%, then splits */
        @keyframes lb-tree {
          0%, 17%   { opacity: 0; transform: translate(-50%, 0) scale(0.4); }
          22%       { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
          30%, 60%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          62%, 100% { opacity: 0; transform: translate(-50%, 0) scale(1); }
        }

        /* Trunk-half splits at 60%, tilts outward and falls */
        @keyframes lb-half-left {
          0%, 60%   { transform: rotate(0deg) translate(0,0); opacity: 1; }
          72%       { transform: rotate(-55deg) translate(-6px, 4px); opacity: 1; }
          80%       { transform: rotate(-80deg) translate(-10px, 14px); opacity: 0; }
          100%      { transform: rotate(-80deg) translate(-10px, 14px); opacity: 0; }
        }
        @keyframes lb-half-right {
          0%, 60%   { transform: rotate(0deg) translate(0,0); opacity: 1; }
          72%       { transform: rotate(55deg) translate(6px, 4px); opacity: 1; }
          80%       { transform: rotate(80deg) translate(10px, 14px); opacity: 0; }
          100%      { transform: rotate(80deg) translate(10px, 14px); opacity: 0; }
        }

        /* Apples on the tree: visible 30%-62%, then drop to soil as seeds */
        @keyframes lb-apple-drop {
          0%, 28%   { transform: translate(-50%, 0) scale(0); opacity: 0; }
          34%       { transform: translate(-50%, 0) scale(1); opacity: 1; }
          60%       { transform: translate(-50%, 0) scale(1); opacity: 1; }
          /* fall into soil */
          74%       { transform: translate(-50%, 58px) scale(0.85); opacity: 1; }
          82%       { transform: translate(-50%, 66px) scale(0.55); opacity: 0.9; }
          /* bury */
          90%, 100% { transform: translate(-50%, 70px) scale(0.35); opacity: 0; }
        }

        /* Soil pulse when seeds bury */
        @keyframes lb-soil {
          0%, 78%   { transform: scaleX(1); opacity: 0.45; }
          85%       { transform: scaleX(1.25); opacity: 0.9; }
          94%, 100% { transform: scaleX(1); opacity: 0.45; }
        }

        .lb-sprout    { animation: lb-sprout    var(--loop) ease-out infinite; transform-origin: bottom center; }
        .lb-tree      { animation: lb-tree      var(--loop) cubic-bezier(.34,1.4,.64,1) infinite; transform-origin: bottom center; }
        .lb-half-l    { animation: lb-half-left var(--loop) cubic-bezier(.5,.05,.8,.6) infinite; transform-origin: bottom right; }
        .lb-half-r    { animation: lb-half-right var(--loop) cubic-bezier(.5,.05,.8,.6) infinite; transform-origin: bottom left; }
        .lb-apple     { animation: lb-apple-drop var(--loop) cubic-bezier(.55,.05,.7,.95) infinite; }
        .lb-soil      { animation: lb-soil       var(--loop) ease-in-out infinite; transform-origin: center; }
      `}</style>

      {/* Soil */}
      <div className="lb-soil absolute left-1/2 -translate-x-1/2 bottom-2 h-1 w-28 rounded-full"
           style={{ background: "linear-gradient(to right, transparent, hsl(25 45% 30%), transparent)" }} />

      {/* Tiny sprout (start of loop) */}
      <div className="lb-sprout absolute left-1/2 bottom-2 w-3 h-5">
        <svg viewBox="0 0 12 20" className="w-full h-full">
          <line x1="6" y1="20" x2="6" y2="10" stroke="hsl(140 60% 40%)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 12 C 2 11, 1 7, 4 6" fill="hsl(140 65% 50%)" />
          <path d="M6 10 C 10 9, 11 5, 8 4" fill="hsl(140 65% 50%)" />
        </svg>
      </div>

      {/* Full tree (trunk halves + canopy + apples) */}
      <div className="lb-tree absolute left-1/2 bottom-2 w-24 h-24">
        {/* Trunk left half */}
        <div className="lb-half-l absolute left-1/2 bottom-0 -translate-x-full w-1.5 h-12 rounded-l-full"
             style={{ background: "linear-gradient(to top, hsl(25 45% 30%), hsl(25 55% 42%))" }} />
        {/* Trunk right half */}
        <div className="lb-half-r absolute left-1/2 bottom-0 w-1.5 h-12 rounded-r-full"
             style={{ background: "linear-gradient(to top, hsl(25 45% 35%), hsl(25 55% 45%))" }} />

        {/* Canopy (fades with the tree container) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="40" r="26" fill="hsl(140 55% 40%)" opacity="0.95" />
            <circle cx="24" cy="38" r="18" fill="hsl(140 60% 45%)" opacity="0.9" />
            <circle cx="56" cy="38" r="18" fill="hsl(140 60% 45%)" opacity="0.9" />
            <circle cx="40" cy="22" r="18" fill="hsl(140 65% 50%)" opacity="0.95" />
          </svg>
        </div>
      </div>

      {/* Falling apples (overlaid above the canopy positions so they survive the split) */}
      <Apple className="lb-apple absolute" style={{ left: "34%", bottom: "70px" }} />
      <Apple className="lb-apple absolute" style={{ left: "50%", bottom: "78px", animationDelay: "0.12s" }} />
      <Apple className="lb-apple absolute" style={{ left: "66%", bottom: "70px", animationDelay: "0.24s" }} />
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
