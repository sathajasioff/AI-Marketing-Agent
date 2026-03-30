import Anthropic from "@anthropic-ai/sdk";
import Generation from "../models/Generation.js";
import Client from "../models/Client.js";
import EventSettings from "../models/EventSettings.js";
import KnowledgeBase from "../models/KnowledgeBase.js";
import { recordPromptUse, hashPrompt } from "../services/learningService.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Token limits per agent type ──
const TOKEN_LIMITS = {
  strategy: 4000,
  content: 2500,
  email: 3000,
  leads: 1200,
};

// ── Get client business context (replaces hardcoded EventSettings fallback) ──
export const getClientContext = async (clientId) => {
  const settings = await EventSettings.findOne({ clientId });
  if (settings) {
    return `\nCLIENT CONTEXT:
BUSINESS/EVENT: ${settings.eventName}
DATE/DETAILS: ${settings.eventDate}, ${settings.eventLocation}
PRICE POINT: ${settings.ticketPrice}
TARGET AUDIENCE: ${settings.targetAudience}
VALUE PROPOSITIONS: ${settings.valuePropositions}
BRAND VOICE: ${settings.brandVoice}\n`;
  }

  // ── Dynamic fallback from Client model — no hardcoding ──
  const client = await Client.findById(clientId).lean();
  if (!client) return "";
  return `\nCLIENT CONTEXT:
BUSINESS: ${client.companyName || "Client Business"}
INDUSTRY: ${client.industry || "General"}
PLAN: ${client.plan}\n`;
};

// ── Brand voice — scoped to client ──
export const getBrandVoiceContext = async (brandVoiceId, clientId) => {
  if (!brandVoiceId) return "";
  try {
    const voice = await KnowledgeBase.findOne({ _id: brandVoiceId, clientId });
    if (!voice) return "";
    return `\n\n═══════════════════════════════════════════
ACTIVE BRAND VOICE — APPLY TO ALL OUTPUT
═══════════════════════════════════════════
${voice.content}
═══════════════════════════════════════════
IMPORTANT: Every word you generate must follow the brand voice above.
The writing style, frameworks, tone, and language patterns defined above
override any default style. Do not use generic AI-sounding copy.
═══════════════════════════════════════════\n`;
  } catch {
    return "";
  }
};

// ── Core Claude caller — scoped to client, billing-aware ──
export const callClaude = async ({
  systemPrompt,
  userPrompt,
  agentType,
  subType = null,
  inputParams,
  clientId,
  maxTokens,
}) => {
  const limit = maxTokens || TOKEN_LIMITS[agentType] || 1800;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: limit,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const output = message.content.map((b) => b.text || "").join("");
  const tokensUsed =
    (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);
  const promptHash = hashPrompt(systemPrompt, userPrompt);

  // ── Log prompt use for learning ──
  await recordPromptUse({
    clientId,
    agentType,
    subType,
    promptHash,
    promptSnapshot: { systemPrompt, userPromptTemplate: userPrompt },
  });

  // ── Save generation history ──
  const generation = await Generation.create({
    clientId,
    agentType,
    subType,
    inputParams,
    output,
    tokensUsed,
    promptHash,
  });

  // ── Increment usage counter — non-blocking ──
  Client.findByIdAndUpdate(clientId, { $inc: { generationsUsed: 1 } }).catch(
    () => {}
  );

  return { output, generationId: generation._id, tokensUsed, promptHash };
};

// ── Streaming Claude caller — sends SSE chunks to client ──
export const streamAgent = async ({
  req,
  res,
  systemPrompt,
  userPrompt,
  agentType,
  subType = null,
  clientId,
}) => {
  const limit = TOKEN_LIMITS[agentType] || 1800;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullOutput = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: limit,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta?.text) {
        fullOutput += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    const finalMsg = await stream.finalMessage();
    const tokensUsed =
      (finalMsg.usage?.input_tokens || 0) +
      (finalMsg.usage?.output_tokens || 0);
    const promptHash = hashPrompt(systemPrompt, userPrompt);

    // ── Save after stream completes ──
    const generation = await Generation.create({
      clientId,
      agentType,
      subType,
      inputParams: req.body,
      output: fullOutput,
      tokensUsed,
      promptHash,
    });

    Client.findByIdAndUpdate(clientId, { $inc: { generationsUsed: 1 } }).catch(
      () => {}
    );

    res.write(
      `data: ${JSON.stringify({
        done: true,
        generationId: generation._id,
        tokensUsed,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};
