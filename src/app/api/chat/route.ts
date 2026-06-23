import { generateText, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { provider, model, messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json(
      { error: "Missing or invalid 'messages' in request body" },
      { status: 400 }
    );
  }

  const modelMessages: ModelMessage[] = messages.map(
    (m: { role: "user" | "assistant"; content: string }) => ({
      role: m.role,
      content: m.content,
    })
  );

  const { text } = await generateText({
    model: getModel(provider, model),
    messages: modelMessages,
  });

  return Response.json({ message: text });
}