"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroBackdrop } from "@/components/landing/illustrations"
import { EASE } from "@/components/landing/section"

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: EASE },
})

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
    <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">

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
 

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex flex-col items-center text-center">
          {/* Announcement — points at a real section instead of decorating */}
          <motion.a
            {...rise(0)}
            href="#ai-workspace"
            className="lp-surface group text-ink-soft hover:text-ink hover:border-brand-line inline-flex items-center gap-2 rounded-full py-1.5 pr-3 pl-2 text-[13px] transition-colors"
          >
            <span className="bg-brand-wash text-brand-ink flex h-5 items-center rounded-full px-2 text-[11px] font-semibold">
              New
            </span>
            Ask questions across every connected tool
            <ArrowRight className="text-ink-faint size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>

          <motion.h1
            {...rise(0.06)}
            className="text-ink mt-7 text-[40px] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-[56px] md:text-[68px]"
          >
            All your work in
          <br />
          one{" "}
          <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            intelligent workspace.
          </span>
       
       
          </motion.h1>

          <motion.p
            {...rise(0.12)}
            className="text-ink-soft mt-6 max-w-xl text-[16px] leading-[1.65] text-pretty md:text-[17px]"
          >
            Synapse reads your projects, docs, tasks and repositories, then
            answers in context — with citations you can click and tasks it can
            write back.
          </motion.p>

          <motion.div
            {...rise(0.18)}
            className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
          >
            <Button
              size="lg"
              className="h-11 w-full gap-2 rounded-lg px-6 text-[15px] font-medium shadow-rest sm:w-auto"
              asChild
            >
              <a href="/sign-up">
                Start for free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-line text-ink hover:bg-surface-1 h-11 w-full rounded-lg bg-white px-6 text-[15px] font-medium shadow-rest sm:w-auto"
              asChild
            >
              <a href="#product">See it in action</a>
            </Button>
          </motion.div>

          <motion.p {...rise(0.24)} className="text-ink-faint mt-6 text-[13px]">
            Free plan, no card required · Connect your first tool in a minute
          </motion.p>
        </div>
      </div>
    </section>
  )
}
