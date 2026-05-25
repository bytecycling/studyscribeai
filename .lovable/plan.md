## Plan

### 1. Google verification tag
- Add `<meta name="google-site-verification" content="YmOeALL6xCNS15v-r0vSlw1XO3rq9kLhlc5wXIklP2A" />` inside `<head>` of `index.html`.

### 2. New loading animation (AppleBookLoader)
Replace current sequence in `src/components/AppleBookLoader.tsx` with:
- Tree stands with apples, then **trunk splits down the middle** (two halves tilt outward and fall).
- Apples drop to the soil as **seeds**.
- Seeds bury into soil (small bounce + fade into ground).
- Soil pulses, a new sprout emerges → grows into the tree → loop.
- Pure CSS keyframes, same ~160x120 footprint, respect reduced-motion.

### 3. KaTeX/LaTeX in quizzes and flashcards
- `FlashcardItem.tsx` already uses remark-math/rehype-katex but content may arrive with single `\` escaping. Add a `normalizeMath()` helper that:
  - Converts `\(...\)` → `$...$`, `\[...\]` → `$$...$$`.
  - Unescapes double-escaped backslashes (`\\\\` → `\\`) coming from JSON.
- Apply same `ReactMarkdown` + remark-math/rehype-katex setup to `InteractiveQuiz.tsx` for question text, options, and explanation (currently likely plain text).
- Ensure `katex.min.css` already imported globally (it is via `main.tsx`).

### 4. Bold rendering glitches (`**-2**` showing literally)
Root cause: Markdown does not bold when `**` is adjacent to punctuation/digits with no space, or when stray spaces break the pair (`** -2 **`). Fix in renderer layer:
- Add a `sanitizeMarkdown()` util applied wherever notes/translations render (`NoteDetail.tsx` notes view, translated content, quiz, flashcards):
  - Collapse `**\s+(.+?)\s+**` → `**$1**`.
  - Normalize Unicode bold/italic stars and stray ` ** ` patterns.
  - Strip stray single `*` around numbers like `*-2*` → `-2`.
- Also tighten the generation prompt in `supabase/functions/generate-study-pack/index.ts` and `translate-note/index.ts` to forbid spaces inside `**…**`.

### 5. Regenerate-with-feedback flow
When user clicks "Regenerate" on a note:
- Open a dialog (`RegenerateDialog.tsx`) with:
  - Quick toggles: More concise · Summarize · Expand detail · Simpler language · More examples.
  - Free-text "What should change?" textarea (placeholder examples: "focus on chapter 2", "skip the history section", "don't include formulas").
  - Confirms with "Regenerate notes".
- Pass `userInstructions` + selected toggles to `generate-study-pack` edge function as a new `regeneration_feedback` field.
- Edge function injects feedback into the system prompt with a hard rule: feedback only modifies note style/scope, must stay grounded in the original source content (no new outside info).
- Wire from `NoteDetail.tsx` regenerate button.

### 6. Notes page aesthetics
In `src/pages/NoteDetail.tsx` and the notes container:
- Replace flat white/black surface with themed design tokens:
  - Soft gradient background (`from-background via-background to-primary/5`).
  - Card surface uses `bg-card/80 backdrop-blur` with subtle border and `shadow-elegant`.
  - Section headings (Cornell: Notes / Cue Questions / Summary) get colored accent strip on the left using `--primary` / `--accent`.
  - Cue Questions block: tinted `bg-primary/5` with rounded corners.
  - Summary block: tinted `bg-accent/10` with italic serif heading.
- Improve typography: bigger leading, max-width prose, better spacing between bullets.
- Add subtle `animate-fade-in` on mount.
- Keep dark mode first (existing tokens), ensure light mode still readable.

### Technical notes
- No DB schema changes.
- Edge functions changed: `generate-study-pack` (accept feedback), possibly `translate-note` (prompt tightening only).
- New files: `src/components/RegenerateDialog.tsx`, `src/lib/markdown.ts` (sanitize/normalize helpers).
- Edited files: `index.html`, `AppleBookLoader.tsx`, `FlashcardItem.tsx`, `InteractiveQuiz.tsx`, `NoteDetail.tsx`, `generate-study-pack/index.ts`, `translate-note/index.ts`.
