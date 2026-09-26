import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendPasswordResetEmail } from "./mail";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    // Whoever had the old password shouldn't stay signed in after a reset.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Swallowed on purpose: the request must answer the same whether or not
      // mail went out, so the form can't be used to probe which emails exist.
      try {
        await sendPasswordResetEmail({ email: user.email, name: user.name, url })
      } catch (err) {
        console.error("[auth] password reset email failed:", err)
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});