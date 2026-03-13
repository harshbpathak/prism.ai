import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';

import { NextRequest } from 'next/server';
import { getCopilotKitConfig } from '@/lib/ai-config';

// Uses AI_MODELS.chat + GOOGLE_API_KEY_ORCHESTRATOR (or fallback to main key)
// To change model or key, edit lib/ai-config.ts
const { model, apiKey } = getCopilotKitConfig('chat');
const serviceAdapter = new GoogleGenerativeAIAdapter({ model, apiKey });
const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  return handleRequest(req);
};