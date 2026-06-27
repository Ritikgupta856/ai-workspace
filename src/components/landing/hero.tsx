"use client"

import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  MessageCircle,
  CheckSquare,
  FileText,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react"

const floatingIcons = [
  {
    icon: MessageCircle,
    label: "Chat",
    className: "left-[14%] top-[22%] text-violet-600",
    delay: 0.4,
  },
  {
    icon: CheckSquare,
    label: "Tasks",
    className: "left-[8%] top-[50%] text-emerald-500",
    delay: 0.55,
  },
  {
    icon: FileText,
    label: "Docs",
    className: "left-[14%] top-[78%] text-amber-500",
    delay: 0.7,
  },
  {
    icon: Users,
    label: "Team",
    className: "right-[14%] top-[22%] text-blue-600",
    delay: 0.4,
  },
  {
    icon: Calendar,
    label: "Calendar",
    className: "right-[8%] top-[50%] text-rose-500",
    delay: 0.55,
  },
  {
    icon: Sparkles,
    label: "AI",
    className: "right-[14%] top-[78%] text-violet-600",
    delay: 0.7,
  },
]

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden pt-16">
      {floatingIcons.map(({ icon: Icon, label, className, delay }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute hidden lg:flex flex-col items-center gap-1.5 ${className}`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay + 0.5,
            }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm"
          >
            <Icon className="h-7 w-7" strokeWidth={2} />
          </motion.div>
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </motion.div>
      ))}

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="mr-1.5 size-3.5 text-primary" />
            AI Workspace for Modern Teams
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          All your work in
          <br />
          one{" "}
          <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            intelligent workspace.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Plan projects, manage tasks, collaborate with your team, write docs, and automate workflows with AI—all from a single workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" className="gap-2 text-base" asChild>
            <a href="/sign-up">
              Get Started Free
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="text-base" asChild>
            <a href="#demo">Live Demo</a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}