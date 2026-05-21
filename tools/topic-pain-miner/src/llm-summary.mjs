import { buildDemandHeatmapSummaryPrompt } from "./pain-miner.mjs";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export async function summarizeDemandWithOpenAI(analysis, options = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when --llm is enabled");
  }

  const baseUrl = String(options.baseUrl ?? process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const prompt = options.prompt ?? buildDemandHeatmapSummaryPrompt(analysis);

  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You summarize startup demand evidence. Stay evidence-bounded and do not invent facts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? `OpenAI-compatible API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error("OpenAI-compatible API response did not include summary text");
  }

  return String(content).trim();
}
