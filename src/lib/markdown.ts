/**
 * Shared markdown / math text normalization so notes, flashcards, quizzes
 * and translations render the same way.
 */

/** Fix common bold breakage from LLMs (e.g. "** -2 **" → "**-2**"). */
export function sanitizeBold(s: string): string {
  if (!s) return s;
  let out = s;

  // Normalize fancy / unicode stars to ASCII *
  out = out.replace(/[\u2217\u2731\uFF0A]/g, "*");

  // ***word*** (bold+italic) → **word** to avoid mis-parsing
  out = out.replace(/\*\*\*([^*\n]+?)\*\*\*/g, "**$1**");

  // Collapse spaces immediately inside ** ... ** ("** word **" → "**word**")
  out = out.replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, "**$1**");
  out = out.replace(/\*\*\s+([^*\n]+?)\*\*/g, "**$1**");
  out = out.replace(/\*\*([^*\n]+?)\s+\*\*/g, "**$1**");

  // Repair unmatched bold: "**word*" → "**word**" and "*word**" → "**word**"
  out = out.replace(/\*\*([^*\n]{1,120}?)\*(?!\*)/g, "**$1**");
  out = out.replace(/(?<!\*)\*([^*\n]{1,120}?)\*\*/g, "**$1**");

  // Ensure a space between bold runs and adjacent words.
  out = out.replace(/([A-Za-z0-9)\]])\*\*([^*\n]+?)\*\*/g, "$1 **$2**");
  out = out.replace(/\*\*([^*\n]+?)\*\*([A-Za-z0-9(\[])/g, "**$1** $2");

  // Italics: "* word *" → "*word*"
  out = out.replace(/(^|[^*])\*\s+([^*\n]+?)\s+\*(?!\*)/g, "$1*$2*");

  // Strip stray lone "*" surrounded by spaces (e.g. " * " left over from a broken pair)
  out = out.replace(/(^|\s)\*(\s)/g, "$1$2");
  // Strip orphan "**" not paired on the same line
  out = out.replace(/^(.*?)\*\*([^*\n]*)$/gm, (line, pre, rest) => {
    // if there is no other ** in the rest, drop the orphan
    if (rest.includes("**")) return line;
    return pre + rest;
  });

  return out;
}

/** Normalize math delimiters so remark-math always picks them up. */
export function normalizeMath(s: string): string {
  if (!s) return s;
  let out = s;
  // \( ... \)  →  $ ... $
  out = out.replace(/\\\((.+?)\\\)/gs, (_m, body) => `$${body}$`);
  // \[ ... \]  →  $$ ... $$
  out = out.replace(/\\\[(.+?)\\\]/gs, (_m, body) => `$$${body}$$`);
  return out;
}

/** Run all sanitizers (use everywhere markdown is rendered). */
export function sanitizeMarkdown(s: string): string {
  if (!s) return s;
  return sanitizeBold(normalizeMath(s));
}
