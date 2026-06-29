import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Join ${workspaceName} on Synapse</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          }
          .header {
            background-color: #2563eb;
            padding: 32px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            padding: 32px;
          }
          .greeting {
            font-size: 16px;
            line-height: 24px;
            margin-bottom: 24px;
          }
          .role-badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-weight: 600;
            font-size: 13px;
            padding: 4px 10px;
            border-radius: 9999px;
            margin-bottom: 20px;
          }
          .message-box {
            background-color: #f3f4f6;
            border-left: 4px solid #d1d5db;
            padding: 16px;
            margin: 20px 0;
            font-style: italic;
            border-radius: 0 8px 8px 0;
            color: #4b5563;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            font-weight: 600;
            font-size: 15px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          }
          .btn:hover {
            background-color: #1d4ed8;
          }
          .notice {
            font-size: 13px;
            color: #6b7280;
            line-height: 20px;
            margin-top: 24px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          .link {
            color: #2563eb;
            text-decoration: underline;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Join ${workspaceName} on Synapse</h1>
          </div>
          <div class="content">
            <p class="greeting">Hi there,</p>
            <p class="greeting">
              <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Synapse as a <span class="role-badge">${role}</span>.
            </p>
            ${
              message
                ? `<div class="message-box">"${message}"</div>`
                : ""
            }
            <div class="btn-container">
              <a href="${inviteUrl}" class="btn" target="_blank">Accept Invitation</a>
            </div>
            <p class="notice">
              This invitation will expire in 7 days. If the button above does not work, copy and paste the following link into your browser:<br />
              <a href="${inviteUrl}" class="link">${inviteUrl}</a>
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Synapse Labs. All rights reserved.<br />
            Synapse — The AI-powered workspace for modern teams.
          </div>
        </div>
      </body>
    </html>
  `

  if (resend) {
    try {
      const response = await resend.emails.send({
  from: "Synapse <noreply@synapse.ritikgupta.in>",
        to: email,
        subject: `Join ${workspaceName} on Synapse`,
        html,
      })
      if (response.error) {
        throw new Error(response.error.message || "Failed to send email via Resend")
      }
      return response
    } catch (err: any) {
      console.error("Resend Email error:", err)
      throw new Error(err.message || "Email delivery failed")
    }
  } else {
    console.log(`
========================================
[MOCK MAIL SENDING SUCCESS]
To: ${email}
Subject: Join ${workspaceName} on Synapse
Invite Link: ${inviteUrl}
Role: ${role}
========================================
    `)
    return { id: "mock-id" }
  }
}
