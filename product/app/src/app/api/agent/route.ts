import { NextRequest, NextResponse } from 'next/server';

/**
 * Agent API route — proxies chat to an LLM with stage-specific context.
 *
 * In the prototype, this uses a simple fetch to Claude/OpenAI API.
 * Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local.
 *
 * If no API key is set, returns a simulated response.
 */

interface AgentRequestBody {
  message: string;
  projectId: string;
  projectName: string;
  stageId: string | null;
  history: Array<{ role: string; content: string }>;
}

const STAGE_SYSTEM_PROMPTS: Record<string, string> = {
  validate: `You are a startup validation expert. You help founders validate their ideas by analyzing Reddit pain points, Google Trends data, and competitor landscapes. Be direct and evidence-based. If the data is weak, say so honestly.`,
  'business-model': `You are a startup business model advisor. You help founders choose the right business model (SaaS, one-time, marketplace, etc.), set pricing, and project revenue. Reference real indie hacker case studies when possible.`,
  build: `You are a technical co-founder and coding agent. You help with tech stack selection, project scaffolding, architecture decisions, and implementation. You follow AI-native development practices.`,
  grow: `You are a growth marketing expert for indie products. You specialize in SEO, content marketing, Product Hunt launches, and community-driven distribution. Be specific about tactics, not generic advice.`,
  operate: `You are a product analytics expert. You help founders interpret metrics (retention, churn, MRR), diagnose problems using data, and design A/B tests. Use the retention decision tree framework.`,
};

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequestBody = await request.json();
    const { message, projectName, stageId, history } = body;

    const systemPrompt = `${STAGE_SYSTEM_PROMPTS[stageId || 'validate'] || STAGE_SYSTEM_PROMPTS.validate}

You are helping with the project: "${projectName}".
Current stage: ${stageId || 'general'}.

Keep your responses concise and actionable. Use markdown formatting.`;

    // Try Anthropic API first
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      const reply = await callAnthropic(anthropicKey, systemPrompt, history, message);
      return NextResponse.json({ reply });
    }

    // Try OpenAI API
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const reply = await callOpenAI(openaiKey, systemPrompt, history, message);
      return NextResponse.json({ reply });
    }

    // Fallback: simulated response
    return NextResponse.json({
      reply: generateSimulatedResponse(message, stageId),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ reply: `Error: ${errorMessage}` }, { status: 500 });
  }
}

async function callAnthropic(apiKey: string, systemPrompt: string, history: Array<{ role: string; content: string }>, message: string): Promise<string> {
  const messages = [
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: message },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text || 'No response from Claude.';
}

async function callOpenAI(apiKey: string, systemPrompt: string, history: Array<{ role: string; content: string }>, message: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from OpenAI.';
}

function generateSimulatedResponse(message: string, stageId: string | null): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('subreddit') || lowerMessage.includes('reddit')) {
    return `I'd suggest searching these subreddits for more data:\n\n- **r/Entrepreneur** — general startup discussions\n- **r/SaaS** — SaaS-specific pain points\n- **r/smallbusiness** — small business owner struggles\n\nTo add them, re-run validation with \`--subreddits\` flag or click "Pivot" and add them to the advanced options.\n\n*Note: This is a simulated response. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local for real AI responses.*`;
  }

  if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return `Based on common indie hacker patterns:\n\n- **Freemium**: Free tier for basic use, $9-29/mo for pro\n- **Usage-based**: Pay per analysis/report\n- **One-time**: $49-149 lifetime deal (good for early traction)\n\nMost successful indie products start with a simple 2-tier model and add complexity later.\n\n*Simulated response — set API key for real analysis.*`;
  }

  if (lowerMessage.includes('market') || lowerMessage.includes('japan') || lowerMessage.includes('china')) {
    return `To analyze a different market:\n\n1. Re-run validation with \`--geo JP\` for Japan or \`--geo CN\` for China\n2. Use localized keywords in the target language\n3. Check local competitors (they won't show up in English searches)\n\nDifferent markets have different pain intensities and willingness to pay.\n\n*Simulated response — set API key for real analysis.*`;
  }

  return `I understand you're asking about: "${message}"\n\nIn the **${stageId || 'general'}** stage, I can help with analysis, research, and strategy. Try asking me specific questions like:\n\n- "What subreddits should I search?"\n- "Compare pricing models for this idea"\n- "Analyze the Japanese market for this"\n\n*This is a simulated response. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env.local file for real AI-powered responses.*`;
}
