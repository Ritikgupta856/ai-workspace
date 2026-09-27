import type { Metadata } from "next"

import { LegalPage, LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy — Synapse",
  description: "What Synapse collects, how it's used, and the services that handle it.",
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="27 September 2026"
      intro="Synapse keeps your team's work in one place and answers questions about it. This page explains, in plain language, what we store to do that, who helps us run it, and what you can delete."
    >
      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Your account:</strong> your name and email, and your password (stored hashed) or
            your Google profile if you sign in with Google.
          </li>
          <li>
            <strong>Your workspace:</strong> the projects, tasks, comments, pages, whiteboards, chats
            and files you and your teammates create or upload.
          </li>
          <li>
            <strong>Connected tools:</strong> when you connect GitHub, Notion, Linear or Figma, we
            store an access token for that connection. Content from those tools is read when you or
            the assistant need it to answer a question.
          </li>
          <li>
            <strong>Billing:</strong> if you upgrade, payment is handled by Dodo Payments. We keep
            your subscription status, not your card details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          Only to run Synapse: to show your work, make it searchable, answer your questions, and
          send the emails you ask for, such as invites and password resets.
        </p>
        <p>We don&apos;t sell your data, and we don&apos;t use your content to advertise to you.</p>
      </LegalSection>

      <LegalSection title="How the AI assistant handles your content">
        <p>
          When you ask a question, the question and the relevant parts of your workspace are sent
          through Vercel AI Gateway to an AI model provider, such as OpenAI or Google, to generate
          the answer. Synapse doesn&apos;t use your content to train models, and one
          workspace&apos;s content is never used to answer another&apos;s questions.
        </p>
      </LegalSection>

      <LegalSection title="Services that help us run Synapse">
        <ul>
          <li><strong>Vercel</strong> hosts the app and routes AI requests.</li>
          <li><strong>Neon</strong> stores the database.</li>
          <li><strong>Cloudinary</strong> stores uploaded files.</li>
          <li><strong>Resend</strong> sends email.</li>
          <li><strong>Dodo Payments</strong> processes subscriptions.</li>
          <li><strong>Google</strong> provides sign-in, if you choose it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who can see your workspace">
        <p>
          Content in a workspace is visible to that workspace&apos;s members, according to their
          role. Nobody outside the workspace can see it.
        </p>
      </LegalSection>

      <LegalSection title="Deleting your data">
        <p>
          A workspace owner can delete the workspace at any time, which removes its projects,
          tasks, pages, chats and uploaded files. Disconnecting a tool removes Synapse&apos;s access
          to it.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this page changes in a way that matters, we&apos;ll update the date at the top and let
          workspace owners know.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
