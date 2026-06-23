import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export function getModel(provider: string, model: string) {
  switch (provider) {
    case "google":
      return google(model);

    case "openai":
      return openai(model);

    default:
      throw new Error("Unsupported provider");
  }
}