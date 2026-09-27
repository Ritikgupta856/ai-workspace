import type { Metadata } from "next"

import { LegalPage, LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms — Synapse",
  description: "The terms for using Synapse, in plain language.",
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="27 September 2026"
      intro="These terms cover your use of Synapse. By creating an account or using the app, you agree to them."
    >
      <LegalSection title="Your account">
        <p>
          You&apos;re responsible for keeping your sign-in details safe and for what happens in your
          account. Workspace owners decide who is invited and which role each member has.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You own everything you and your team put into Synapse. You give us permission to store
          and process it only as needed to run the service — for example, to search it or to answer
          a question you ask.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <ul>
          <li>Don&apos;t use Synapse for anything illegal or to harm others.</li>
          <li>Don&apos;t try to access workspaces or data you haven&apos;t been given access to.</li>
          <li>Don&apos;t disrupt the service, probe it for weaknesses, or resell it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="AI answers">
        <p>
          The assistant answers from your workspace and connected tools, and shows its sources. It
          can still make mistakes, so check anything important before you rely on it.
        </p>
      </LegalSection>

      <LegalSection title="Plans and billing">
        <p>
          Synapse has a Free plan and a Pro plan. Pro is billed monthly per workspace through Dodo
          Payments. You can cancel at any time; Pro stays active until the end of the period
          you&apos;ve paid for, and the workspace then returns to the Free plan&apos;s limits.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          We work to keep Synapse running smoothly, but it&apos;s provided as-is and we can&apos;t
          promise it will never be interrupted. Features and limits may change over time; if a
          change affects your plan, we&apos;ll tell workspace owners first.
        </p>
      </LegalSection>

      <LegalSection title="Ending your use">
        <p>
          You can stop using Synapse and delete your workspace whenever you like. We may suspend
          accounts that break these terms.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
