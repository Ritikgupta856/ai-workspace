"use client"

import { motion } from "framer-motion"
import { ArrowRight, Check, Bot, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AiWorkspace() {
  return (
    <section id="ai-workspace" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI that works
              <br />
              <span className="text-primary">alongside your team.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Synapse AI is deeply integrated into every part of your workspace.
              It understands context, learns from your data, and helps your team
              move faster without sacrificing quality.
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {[
                "Understands your codebase, docs, and project history",
                "Generates tasks, summaries, and reports instantly",
                "Automates repetitive tasks with natural language triggers",
                "Learns from your team's patterns and preferences",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="size-3 text-primary" />
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild>
                <a href="/sign-up">
                  See AI in action
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Right: AI mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-[40px]" />
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg">
              {/* AI chat interface */}
              <div className="border-b border-border/30 bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="size-3.5" />
                  </div>
                  <span className="text-sm font-medium">Synapse AI</span>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    <Sparkles className="size-3" />
                    Active
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    Y
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs">
                      Summarize the latest PR #342 changes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="size-3" />
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-xs leading-relaxed">
                      PR #342 adds OAuth integration with GitHub. Key changes:
                    </p>
                    <ul className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1">
                        <span className="size-1 rounded-full bg-primary" />
                        New auth provider module
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="size-1 rounded-full bg-primary" />
                        GitHub App webhook handler
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="size-1 rounded-full bg-primary" />
                        Token refresh middleware
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    Y
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs">Create a task for this</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-border/30 pt-3">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Ask Synapse anything...
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
