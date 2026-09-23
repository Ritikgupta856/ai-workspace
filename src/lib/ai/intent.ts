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

/**
 * Direct edits to the workspace: an action verb up front and the thing it acts
 * on right after — "create a task for me", "add a project called Mobile",
 * "please mark the login task as done". These need the write tools, never
 * retrieval, so they skip the router's model call entirely.
 *
 * Deliberately narrow: "open" and "new" are left out ("open tasks" is a status
 * question), and the object must follow within a few words so "create a
 * summary of the auth docs" still goes to the model.
 */
const ACTION_VERBS = new Set([
  "create", "add", "make", "assign", "update", "edit", "rename",
  "move", "mark", "complete", "delete", "remove",
])

const ACTION_OBJECTS = new Set([
  "task", "tasks", "todo", "todos", "project", "projects", "page", "pages",
  "note", "notes", "issue", "issues", "ticket", "tickets", "board", "boards",
])

const POLITE_PREFIX = new Set(["please", "pls", "plz", "can", "could", "would", "you", "hey", "synapse", "kindly"])

export function isWorkspaceAction(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)

  let i = 0
  while (i < words.length && POLITE_PREFIX.has(words[i])) i++

  if (!ACTION_VERBS.has(words[i])) return false
  return words.slice(i + 1, i + 5).some((w) => ACTION_OBJECTS.has(w))
}
