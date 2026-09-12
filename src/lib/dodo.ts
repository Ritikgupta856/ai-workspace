import DodoPayments from "dodopayments"

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" | undefined) ??
    "test_mode",
})

export const DODO_PRO_PRODUCT_ID = process.env.DODO_PAYMENTS_PRO_PRODUCT_ID ?? ""
