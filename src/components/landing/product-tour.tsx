"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Section, Eyebrow, EASE, reveal } from "@/components/landing/section"
import { ScreenshotFrame } from "@/components/landing/screenshot-frame"

/**
 * Real screens from a working workspace, one per row, alternating sides.
 * The screenshot bleeds past the content column on wide screens so each row
 * reads as a window into the product rather than a boxed illustration.
 */

const stops = [
  {
    eyebrow: "Projects",
    title: "Every project, and how it's really going.",
    body: "Status, progress and the people on each project in one list. Progress comes from the tasks themselves, so nobody has to update a slide before the weekly sync.",
    points: [
      "Progress worked out from real task counts",
      "Group, sort and filter by status",
      "List and grid views",
    ],
    image: {
      src: "/images/tour-projects.png",
      alt: "The Synapse projects list: five active projects with status, progress bars and team avatars, and one completed project",
      width: 1784,
      height: 1160,
    },
  },
  {
    eyebrow: "My work",
    title: "Everything on your plate, across every project.",
    body: "Your tasks from every project in one place, grouped by status with priorities and due dates — so the first thing you open in the morning is the right thing.",
    points: [
      "Every task assigned to you, from every project",
      "List, Kanban and Calendar views",
      "Priorities, due dates and comments at a glance",
    ],
    image: {
      src: "/images/tour-my-work.png",
      alt: "The Synapse My work view: tasks grouped into Backlog, In progress, In review and Completed, with priority, project and due date",
      width: 2104,
      height: 1280,
    },
  },
]

export function ProductTour() {
  return (
    <Section id="tour" divider className="overflow-x-clip">
      <div className="flex flex-col gap-24 md:gap-32">
        {stops.map(({ eyebrow, title, body, points, image }, i) => {
          const flip = i % 2 === 1
          return (
            <div
              key={eyebrow}
              className={cn(
                "grid items-center gap-10 lg:gap-16",
                flip
                  ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                  : "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]",
              )}
            >
              {/* ── Copy ─────────────────────────────────────── */}
              <motion.div {...reveal} className={cn(flip && "lg:order-last")}>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h2 className="text-ink mt-4 text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] text-pretty sm:text-[34px] md:text-[40px]">
                  {title}
                </h2>
                <p className="text-ink-soft mt-4 text-[15px] leading-[1.65] md:text-base">
                  {body}
                </p>
                <ul className="mt-7 flex flex-col gap-3">
                  {points.map((point) => (
                    <li key={point} className="text-ink flex items-center gap-3 text-[14px]">
                      <span className="border-brand-line bg-brand-wash flex size-5 shrink-0 items-center justify-center rounded-full border">
                        <Check className="text-brand size-3" strokeWidth={2.75} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* ── Screenshot ───────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className={cn("relative", flip ? "xl:-ml-20" : "xl:-mr-20")}
              >
                <div
                  aria-hidden
                  className="bg-brand/12 pointer-events-none absolute inset-x-[10%] -bottom-6 -z-10 h-32 rounded-full blur-3xl"
                />
                <ScreenshotFrame
                  {...image}
                  sizes="(min-width: 1024px) 700px, 100vw"
                />
              </motion.div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
