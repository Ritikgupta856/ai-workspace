import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = "Synapse <noreply@synapse.ritikgupta.in>"

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char])
}

/** "MEMBER" → "a Member", "ADMIN" → "an Admin". */
function describeRole(role: string) {
  const name = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`
}

// Brand tokens from src/app/globals.css (light theme), as hex for email clients.
const C = {
  primary: "#0073f8",
  text: "#0a1017",
  muted: "#626a73",
  border: "#dce0e4",
  page: "#f5f7f9",
  card: "#ffffff",
  quote: "#f5f7f9",
}

const FONT = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

/**
 * The shared shell for every Synapse email. Tables and inline styles only:
 * Gmail and Outlook drop most <style> rules. Every string passed in must
 * already be escaped.
 */
function renderEmail({
  title,
  preview,
  heading,
  body,
  button,
  note,
  footer,
}: {
  title: string
  preview: string
  heading: string
  body: string
  button: { label: string; url: string }
  note: string
  footer: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.text};">
    <!-- Inbox preview line -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
            <!-- Wordmark -->
            <tr>
              <td style="padding:0 4px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:24px;height:24px;background:${C.primary};border-radius:6px;color:#ffffff;font-size:14px;font-weight:700;text-align:center;line-height:24px;">S</td>
                    <td style="padding-left:8px;font-size:16px;font-weight:600;color:${C.text};">Synapse</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:36px 32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:30px;font-weight:600;color:${C.text};">
                  ${heading}
                </h1>
                ${body}

                <!-- Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                  <tr>
                    <td style="background:${C.primary};border-radius:8px;">
                      <a href="${button.url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${button.label}</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${C.border};font-size:13px;line-height:20px;color:${C.muted};">
                  ${note} If the button doesn't work, paste this link into your browser:<br />
                  <a href="${button.url}" style="color:${C.primary};word-break:break-all;">${button.url}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 4px 0;font-size:12px;line-height:18px;color:${C.muted};">
                ${footer}<br />
                Synapse — the AI workspace for modern teams.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

const paragraph = (html: string) =>
  `<p style="margin:0;font-size:15px;line-height:24px;color:${C.text};">${html}</p>`

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  // No silent fallback: a missing key must surface as a failure, not a fake success.
  if (!resend) {
    throw new Error("Email is not configured (RESEND_API_KEY is missing)")
  }

  try {
    const response = await resend.emails.send({ from: FROM, to, subject, html, text })
    if (response.error) {
      throw new Error(response.error.message || "Failed to send email via Resend")
    }
    return response
  } catch (err) {
    console.error("Resend Email error:", err)
    throw new Error(err instanceof Error ? err.message : "Email delivery failed")
  }
}

interface SendInviteEmailParams {
  email: string
  workspaceName: string
  inviterName: string
  role: string
  token: string
  message?: string | null
}

export async function sendInviteEmail({
  email,
  workspaceName,
  inviterName,
  role,
  token,
  message,
}: SendInviteEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteUrl = `${appUrl}/invite/${token}`
  const roleLabel = describeRole(role)

  // All user-typed: unescaped, an inviter could put links or markup into
  // someone else's inbox.
  const safeWorkspace = escapeHtml(workspaceName)
  const safeInviter = escapeHtml(inviterName)
  const safeRole = escapeHtml(roleLabel)
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br />") : null

  const quote = safeMessage
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:${C.quote};border-left:3px solid ${C.border};border-radius:0 8px 8px 0;padding:14px 16px;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.04em;">Message from ${safeInviter}</p>
                      <p style="margin:0;font-size:14px;line-height:22px;color:${C.text};">${safeMessage}</p>
                    </td>
                  </tr>
                </table>`
    : ""

  const html = renderEmail({
    title: `Join ${safeWorkspace} on Synapse`,
    preview: `${safeInviter} invited you to join ${safeWorkspace} on Synapse.`,
    heading: `Join ${safeWorkspace} on Synapse`,
    body:
      paragraph(
        `<strong>${safeInviter}</strong> has invited you to collaborate in the <strong>${safeWorkspace}</strong> workspace as ${safeRole}.`
      ) + quote,
    button: { label: "Accept invitation", url: inviteUrl },
    note: "This invitation expires in 7 days.",
    footer: `This invitation was sent to ${escapeHtml(email)}. If you weren't expecting it, you can ignore this email.`,
  })

  // Plain-text part for clients that don't render HTML; it also helps spam scoring.
  const text = [
    `${inviterName} has invited you to collaborate in the ${workspaceName} workspace on Synapse as ${roleLabel}.`,
    message ? `\nMessage from ${inviterName}:\n"${message}"\n` : "",
    `Accept the invitation: ${inviteUrl}`,
    "",
    "This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.",
  ].join("\n")

  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on Synapse`,
    html,
    text,
  })
}

export async function sendPasswordResetEmail({
  email,
  name,
  url,
}: {
  email: string
  name?: string | null
  /** better-auth's one-time link; it verifies the token, then redirects to /reset-password. */
  url: string
}) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,"

  const html = renderEmail({
    title: "Reset your Synapse password",
    preview: "Use this link to choose a new password. It expires in 1 hour.",
    heading: "Reset your password",
    body:
      paragraph(greeting) +
      `<p style="margin:12px 0 0;font-size:15px;line-height:24px;color:${C.text};">We received a request to reset the password for your Synapse account. Click the button below to choose a new one.</p>`,
    button: { label: "Reset password", url },
    note: "This link expires in 1 hour and can only be used once.",
    footer: `This email was sent to ${escapeHtml(email)}. If you didn't request a password reset, you can safely ignore it — your password won't change.`,
  })

  const text = [
    name ? `Hi ${name},` : "Hi,",
    "",
    "We received a request to reset the password for your Synapse account.",
    `Choose a new password: ${url}`,
    "",
    "This link expires in 1 hour and can only be used once.",
    "If you didn't request a password reset, you can safely ignore this email.",
  ].join("\n")

  return sendEmail({ to: email, subject: "Reset your Synapse password", html, text })
}
