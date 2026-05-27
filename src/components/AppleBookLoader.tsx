/**
 * Newton-under-the-apple-tree loop:
 *   Tree grows softly →
 *   Newton sits beneath reading →
 *   Apple wiggles, drops, bonks Newton's head →
 *   Newton stands and walks off →
 *   Tree gently fades / decays →
 *   The fallen apple sinks into the soil as a seed →
 *   A small sprout grows into a new tree → Loop.
 *
 * Pure CSS keyframes. Calm, natural pacing. Honors `paused` prop and
 * prefers-reduced-motion.
 */
interface Props {
  paused?: boolean;
}

const AppleBookLoader = ({ paused = false }: Props) => {
  const D = "10s";

  return (
    <div
      className="relative w-48 h-36 mx-auto select-none"
      aria-hidden="true"
      data-paused={paused ? "true" : "false"}
      style={{ ["--loop" as any]: D }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-paused] .lb-tree,
          [data-paused] .lb-newton,
          [data-paused] .lb-apple,
          [data-paused] .lb-soil,
          [data-paused] .lb-sprout { animation-play-state: paused !important; }
        }
        [data-paused="true"] .lb-tree,
        [data-paused="true"] .lb-newton,
        [data-paused="true"] .lb-apple,
        [data-paused="true"] .lb-soil,
        [data-paused="true"] .lb-sprout { animation-play-state: paused !important; }

        /* Tree: grows in, holds while Newton sits & gets bonked,
           THEN (after Newton walks off) fades out so the apple can sprout. */
        @keyframes lb-tree {
          0%        { transform: translate(-50%, 6px) scale(0.4); opacity: 0; transform-origin: bottom center; }
          8%        { transform: translate(-50%, 0)    scale(1);   opacity: 1; }
          70%       { transform: translate(-50%, 0)    scale(1);   opacity: 1; filter: none; }
          /* Newton has now walked away — tree gently decays */
          80%       { transform: translate(-50%, 1px)  scale(0.97); opacity: 0.5; filter: saturate(0.5); }
          86%, 100% { transform: translate(-50%, 4px)  scale(0.9);  opacity: 0;   filter: saturate(0); }
        }

        /* Newton: fades in sitting, bonked, then walks off. */
        @keyframes lb-newton {
          0%, 10%   { transform: translate(0, 4px); opacity: 0; }
          15%       { transform: translate(0, 0);   opacity: 1; }
          15%, 55%  { transform: translate(0, 0);   opacity: 1; }
          /* head bump */
          58%       { transform: translate(0, 2px); opacity: 1; }
          62%       { transform: translate(0, 0);   opacity: 1; }
          /* walk off to the right */
          68%       { transform: translate(28px, 0); opacity: 1; }
          74%       { transform: translate(56px, 0); opacity: 0; }
          100%      { transform: translate(56px, 0); opacity: 0; }
        }

        /* Apple: wiggles, drops on Newton's head, rests on soil while
           tree decays, then sinks into the soil as a seed. */
        @keyframes lb-apple {
          0%, 20%   { transform: translate(-50%, 0) rotate(0deg) scale(1); opacity: 0; }
          25%       { transform: translate(-50%, 0) rotate(0deg) scale(1); opacity: 1; }
          /* gentle wiggle */
          42%       { transform: translate(-50%, 0) rotate(-8deg) scale(1); opacity: 1; }
          46%       { transform: translate(-50%, 0) rotate(8deg)  scale(1); opacity: 1; }
          50%       { transform: translate(-50%, 0) rotate(-6deg) scale(1); opacity: 1; }
          54%       { transform: translate(-50%, 0) rotate(0deg)  scale(1); opacity: 1; }
          /* drop onto Newton's head */
          58%       { transform: translate(-50%, 38px) rotate(0deg) scale(1);    opacity: 1; }
          /* roll a bit then rest on the soil while Newton walks away & tree fades */
          64%       { transform: translate(-30%, 58px) rotate(45deg) scale(0.95); opacity: 1; }
          80%       { transform: translate(-15%, 64px) rotate(90deg) scale(0.9);  opacity: 1; }
          /* tree is now gone — apple sinks into the soil as a seed */
          90%       { transform: translate(-15%, 68px) rotate(90deg) scale(0.5);  opacity: 0.9; }
          95%, 100% { transform: translate(-15%, 70px) rotate(90deg) scale(0.2);  opacity: 0; }
        }

        /* Soil pulse when seed buries */
        @keyframes lb-soil {
          0%, 86%   { transform: scaleX(1);    opacity: 0.5; }
          92%       { transform: scaleX(1.25); opacity: 0.95; }
          98%, 100% { transform: scaleX(1);    opacity: 0.5; }
        }

        /* Sprout: tiny new tree emerges from the soil right at loop end. */
        @keyframes lb-sprout {
          0%, 92%   { transform: translate(-50%, 4px) scaleY(0); opacity: 0; transform-origin: bottom center; }
          96%       { transform: translate(-50%, 0)   scaleY(0.5); opacity: 1; }
          100%      { transform: translate(-50%, 0)   scaleY(1);   opacity: 1; }
        }

        .lb-tree   { animation: lb-tree   var(--loop) cubic-bezier(.34,1.2,.64,1) infinite; }
        .lb-newton { animation: lb-newton var(--loop) ease-in-out infinite; }
        .lb-apple  { animation: lb-apple  var(--loop) cubic-bezier(.55,.05,.7,.95) infinite; }
        .lb-soil   { animation: lb-soil   var(--loop) ease-in-out infinite; transform-origin: center; }
        .lb-sprout { animation: lb-sprout var(--loop) ease-out infinite; }
      `}</style>

      {/* Soil line */}
      <div
        className="lb-soil absolute left-1/2 -translate-x-1/2 bottom-2 h-[3px] w-36 rounded-full"
        style={{ background: "linear-gradient(to right, transparent, hsl(25 45% 32%), transparent)" }}
      />

      {/* Tree (trunk + canopy) */}
      <div className="lb-tree absolute left-1/2 bottom-2 w-28 h-28">
        <svg viewBox="0 0 112 112" className="w-full h-full">
          <path d="M54 110 C 52 90, 50 78, 53 60 C 56 48, 56 40, 54 30"
            stroke="hsl(25 50% 32%)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M55 48 C 62 44, 70 42, 76 40"
            stroke="hsl(25 50% 32%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <g>
            <circle cx="56" cy="30" r="22" fill="hsl(140 50% 38%)" opacity="0.95" />
            <circle cx="40" cy="32" r="16" fill="hsl(140 55% 44%)" opacity="0.9" />
            <circle cx="72" cy="32" r="16" fill="hsl(140 55% 44%)" opacity="0.9" />
            <circle cx="56" cy="18" r="15" fill="hsl(140 60% 50%)" opacity="0.95" />
          </g>
        </svg>
      </div>

      {/* Apple hanging from branch (above Newton) */}
      <div
        className="lb-apple absolute"
        style={{ left: "62%", bottom: "78px", width: 14, height: 14, transformOrigin: "top center" }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path d="M12 7c-2-3-7-2-7 3 0 4 3 9 7 9s7-5 7-9c0-5-5-6-7-3Z" fill="#ef4444" />
          <path d="M12 7c0-2 1-3 2.5-3" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <ellipse cx="9" cy="11" rx="1.2" ry="0.8" fill="#fff" opacity="0.45" />
        </svg>
      </div>

      {/* Newton sitting under the tree reading */}
      <div className="lb-newton absolute" style={{ left: "54%", bottom: "8px", width: 26, height: 32 }}>
        <svg viewBox="0 0 26 32" className="w-full h-full">
          <circle cx="13" cy="6" r="4" fill="hsl(30 35% 75%)" />
          <path d="M9 5 C 10 2, 16 2, 17 5" stroke="hsl(220 15% 25%)" strokeWidth="1.2" fill="none" />
          <path d="M7 22 C 7 13, 19 13, 19 22 L 19 26 L 7 26 Z" fill="hsl(220 30% 35%)" />
          <rect x="6"  y="26" width="6" height="3" rx="1" fill="hsl(220 25% 22%)" />
          <rect x="14" y="26" width="6" height="3" rx="1" fill="hsl(220 25% 22%)" />
          <rect x="7"  y="18" width="12" height="6" rx="1" fill="hsl(35 65% 88%)" stroke="hsl(35 35% 50%)" strokeWidth="0.6" />
          <line x1="13" y1="18" x2="13" y2="24" stroke="hsl(35 35% 50%)" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Tiny sprout that grows from the buried seed at the end of the loop */}
      <div
        className="lb-sprout absolute left-1/2"
        style={{ bottom: "6px", width: 10, height: 18 }}
      >
        <svg viewBox="0 0 10 18" className="w-full h-full">
          <path d="M5 18 L5 9" stroke="hsl(140 55% 35%)" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="2.5" cy="8"  rx="2.5" ry="1.5" fill="hsl(140 60% 45%)" transform="rotate(-25 2.5 8)" />
          <ellipse cx="7.5" cy="7"  rx="2.5" ry="1.5" fill="hsl(140 60% 50%)" transform="rotate(25 7.5 7)" />
        </svg>
      </div>
    </div>
  );
};

export default AppleBookLoader;
