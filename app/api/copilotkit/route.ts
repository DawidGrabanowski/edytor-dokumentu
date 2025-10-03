import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// Konfiguracja runtime
const copilotKit = new CopilotRuntime();

// Endpoint API
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotKit,
    serviceAdapter: new OpenAIAdapter({
      // Klucz API OpenAI - dodaj do .env.local
      // apiKey: process.env.OPENAI_API_KEY,
    }),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
