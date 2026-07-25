"use client"

import { motion } from "framer-motion"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Section, SectionHeading, EASE } from "@/components/landing/section"

/**
 * The questions that actually decide whether someone signs up — retrieval
 * accuracy, access control, and what happens to their data. Answers stay
 * concrete and admit limits, because a vague FAQ reads as evasion.
 */

const faqs = [
  {
    question: "How is this different from asking ChatGPT?",
    answer:
      "A general chatbot starts from zero every time and has never seen your repositories, specs or threads. Synapse indexes those first, retrieves the relevant passages, and answers from them — with a link back to each source, so you can check the answer rather than trust it.",
  },
  {
    question: "Can it see things I'm not supposed to see?",
    answer:
      "No. Retrieval is scoped to your workspace and respects project membership, so an answer can only ever draw on content you already have access to. Connecting a tool doesn't widen anyone's permissions.",
  },
  {
    question: "What happens when it doesn't know?",
    answer:
      "It says so, and tells you what it checked. Synapse is built to answer from indexed content rather than fill gaps with plausible guesses — an answer with no source behind it is worse than no answer.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Connect one source and you can ask a question about it within a minute. Documents are parsed and searchable in seconds; a large repository or Notion workspace takes a few minutes to index in the background while you keep working.",
  },
  {
    question: "Which tools does it connect to?",
    answer:
      "GitHub, Slack, Notion, Linear and Figma today, alongside documents you upload directly. Each connection is per-workspace and can be disconnected at any time, which removes its access immediately.",
  },
  {
    question: "Do you train models on our data?",
    answer:
      "No. Your content is indexed to answer your team's questions and nothing else. It isn't used to train models, and it isn't shared between workspaces.",
  },
]

export function Faq() {
  return (
    <Section id="faq" tone="subtle" divider>
      <SectionHeading
        eyebrow="FAQ"
        title="The things teams ask before they connect anything."
        lede="If something here isn't answered, ask us directly — we'd rather tell you it isn't a fit."
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: EASE }}
        className="mx-auto mt-12 w-full max-w-3xl"
      >
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {faqs.map(({ question, answer }) => (
            <AccordionItem
              key={question}
              value={question}
              className="border-line rounded-xl border bg-white px-5 shadow-rest"
            >
              <AccordionTrigger className="text-ink py-4 text-left text-[14.5px] font-medium tracking-[-0.01em] hover:no-underline">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-ink-soft pb-4 text-[13.5px] leading-[1.65]">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </Section>
  )
}
