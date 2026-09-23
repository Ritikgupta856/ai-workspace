/**
 * Cheap, deterministic intent gate that runs before any tool or retrieval work.
 *
 * Only pure greetings, thanks and goodbyes qualify — messages whose answer can
 * never depend on workspace data. Acknowledgements like "ok", "yes" or "do it"
 * are deliberately excluded: after the agent asks "Shall I create the task?"
 * they are confirmations that need the write tools.
 */

const SMALL_TALK = [
  "hi", "hello", "hey", "hiya", "yo", "hola", "namaste", "greetings",
  "good morning", "good afternoon", "good evening", "good night",
  "thanks", "thank you", "thank u", "thanku", "thx", "thnx", "ty", "tysm",
  "bye", "goodbye", "see you", "see ya", "cya",
]

/** Words that may pad a greeting without changing what it asks for. */
const FILLER = new Set(
  ["there", "so", "much", "a", "lot", "again", "all", "bro", "man", "buddy", "synapse", "for", "the", "help"].map(squash)
)

/** "hiii" / "heyyy" / "thankss" → one letter per run, applied to both sides. */
function squash(word: string) {
  return word.replace(/(.)\1+/g, "$1")
}

const PHRASES = SMALL_TALK.map((p) => p.split(" ").map(squash))

export function isSmallTalk(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(squash)

  if (words.length === 0 || words.length > 6) return false

  let matchedPhrase = false
  let i = 0
  outer: while (i < words.length) {
    for (const phrase of PHRASES) {
      if (phrase.every((w, j) => words[i + j] === w)) {
        matchedPhrase = true
        i += phrase.length
        continue outer
      }
    }
    if (!FILLER.has(words[i])) return false
    i++
  }
  return matchedPhrase
}
