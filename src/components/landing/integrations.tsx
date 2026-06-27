"use client"

import { motion } from "framer-motion"
import {
  GitPullRequest,
  MessageSquare,
  MessageCircle,
  BookOpen,
  Kanban,
  HardDrive,
  PenTool,
  Cpu,
} from "lucide-react"

const integrations = [
  { name: "GitHub", icon: GitPullRequest, bg: "bg-gray-500/10", color: "text-gray-500" },
  { name: "Slack", icon: MessageSquare, bg: "bg-purple-500/10", color: "text-purple-500" },
  { name: "Discord", icon: MessageCircle, bg: "bg-indigo-500/10", color: "text-indigo-500" },
  { name: "Notion", icon: BookOpen, bg: "bg-gray-500/10", color: "text-gray-500" },
  { name: "Linear", icon: Kanban, bg: "bg-blue-500/10", color: "text-blue-500" },
  { name: "Google Drive", icon: HardDrive, bg: "bg-yellow-500/10", color: "text-yellow-600" },
  { name: "Figma", icon: PenTool, bg: "bg-pink-500/10", color: "text-pink-500" },
  { name: "OpenAI", icon: Cpu, bg: "bg-emerald-500/10", color: "text-emerald-500" },
]

export function Integrations() {
  return (
    <section id="integrations" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Connect your favorite tools.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sync data, trigger actions, and collaborate across the tools your
            team already uses.
          </p>
        </motion.div>

        {/* Connection lines */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute inset-0 mx-auto h-full w-full max-w-3xl"
            viewBox="0 0 600 400"
            fill="none"
          >
            {[
              { x1: 300, y1: 80, x2: 80, y2: 200 },
              { x1: 300, y1: 80, x2: 180, y2: 200 },
              { x1: 300, y1: 80, x2: 420, y2: 200 },
              { x1: 300, y1: 80, x2: 520, y2: 200 },
              { x1: 300, y1: 80, x2: 80, y2: 340 },
              { x1: 300, y1: 80, x2: 180, y2: 340 },
              { x1: 300, y1: 80, x2: 420, y2: 340 },
              { x1: 300, y1: 80, x2: 520, y2: 340 },
            ].map((line, i) => (
              <motion.line
                key={i}
                {...line}
                stroke="oklch(0.69 0.17 252 / 0.1)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </svg>

          {/* Center hub */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto mb-12 flex size-20 items-center justify-center rounded-full border-2 border-primary/20 bg-background shadow-lg"
          >
            <span className="text-lg font-bold text-primary">S</span>
          </motion.div>

          {/* Integration grid */}
          <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_20px_rgba(var(--primary),0.06)]"
              >
                <div className={`flex size-12 items-center justify-center rounded-xl ${integration.bg}`}>
                  <integration.icon className={`size-6 ${integration.color}`} />
                </div>
                <span className="text-sm font-medium">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
