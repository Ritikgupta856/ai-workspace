"use client"

import { motion } from "framer-motion"
import {
  Bot,
  FolderKanban,
  CheckSquare,
  BookOpen,
  FileText,
  Puzzle,
  Search,
} from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "AI Workspace",
    description:
      "Built-in AI assistant that understands your projects, code, and documents. Get answers, generate content, and automate tasks.",
    bg: "bg-blue-500/10",
    color: "text-blue-500",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description:
      "Organize work into projects with milestones, timelines, and team collaboration. Keep everything in one place.",
    bg: "bg-amber-500/10",
    color: "text-amber-500",
  },
  {
    icon: CheckSquare,
    title: "Tasks",
    description:
      "Track tasks with Kanban boards, lists, and calendars. Prioritize, assign, and monitor progress in real time.",
    bg: "bg-emerald-500/10",
    color: "text-emerald-500",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description:
      "Create and share a team wiki. Document processes, decisions, and best practices that your AI can reference.",
    bg: "bg-violet-500/10",
    color: "text-violet-500",
  },
  {
    icon: FileText,
    title: "Documents",
    description:
      "Write and collaborate on documents with real-time editing, comments, and AI-powered suggestions.",
    bg: "bg-sky-500/10",
    color: "text-sky-500",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    description:
      "Connect GitHub, Slack, Notion, Linear, and more. Sync data and trigger automations across your toolchain.",
    bg: "bg-teal-500/10",
    color: "text-teal-500",
  },
  {
    icon: Search,
    title: "Search Everything",
    description:
      "Universal search across projects, tasks, documents, chats, and code. Find anything in an instant.",
    bg: "bg-rose-500/10",
    color: "text-rose-500",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to run your work.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Synapse brings together AI, project management, documentation, and
            automation in one seamless experience.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(var(--primary),0.08)]"
            >
              <div className={`mb-4 flex size-10 items-center justify-center rounded-lg ${feature.bg} ${feature.color}`}>
                <feature.icon className="size-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
