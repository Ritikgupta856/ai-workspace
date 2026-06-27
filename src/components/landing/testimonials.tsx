"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Ritik Verma",
    role: "Founder & CEO",
    company: "Synapse",
    avatar: "RV",
    review:
      "Synapse has completely transformed how we build. The AI understands our codebase contextually and surfaces exactly what we need. It's like having a senior engineer on every team.",
  },
  {
    name: "Sarah Chen",
    role: "Engineering Lead",
    company: "TechFlow",
    avatar: "SC",
    review:
      "We evaluated every AI workspace platform. Synapse was the only one that truly understood how modern teams collaborate.",
  },
  {
    name: "Marcus Johnson",
    role: "Head of Product",
    company: "BuildRight",
    avatar: "MJ",
    review:
      "Synapse AI has transformed how our team collaborates. Being able to get instant answers from our codebase and documents is a massive productivity boost.",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by teams worldwide.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            See what teams are saying about Synapse.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-xl border border-border/50 bg-card px-6 py-2 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(var(--primary),0.06)]"
            >
              {/* Quote mark */}
              <div className="mb-2 text-3xl leading-none text-primary/20">
                &ldquo;
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.review}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {t.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
