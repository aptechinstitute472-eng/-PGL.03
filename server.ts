import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'start';

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface MentorChatRequest {
  departmentId: string;
  departmentTitle: string;
  departmentSummary: string;
  activeStepTitle?: string;
  activeStepInstructions?: string;
  languageMode: 'english' | 'roman_urdu' | 'bilingual';
  mentorMode: 'step_coach' | 'full_dossier' | 'deliverable_builder';
  messages: ChatMessageInput[];
}

interface ContentGenerateRequest {
  trackId: string;
  trackTitle: string;
  topic: string;
  languageMode: 'english' | 'roman_urdu' | 'bilingual';
  targetFormat: string;
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(payload: MentorChatRequest): string {
  const languageDirective =
    payload.languageMode === 'roman_urdu'
      ? 'Respond primarily in clear, natural Roman Urdu (everyday conversational Urdu written in English letters, e.g., "Aap ne sab se pehle...") while keeping technical platform terms (RPM, AdSense, Webhook, n8n, CPM, Reels) in clean English.'
      : payload.languageMode === 'bilingual'
      ? 'Respond in a clean Bilingual blend (clear simple English headings and terms with warm Roman Urdu explanations) so both international and Pakistani/Indian freelancers grasp every action item immediately.'
      : 'Respond in crisp, practical, modern English with direct operational clarity.';

  const modeDirective =
    payload.mentorMode === 'step_coach'
      ? `You are in STEP-BY-STEP COACH mode. Guide the user through ONE concrete step at a time. Never dump 20 things at once. Give the exact action for the current step, explain WHY it matters, give an exact micro-task they should do right now, and end by asking them to confirm or share their output before moving to the next step.`
      : payload.mentorMode === 'full_dossier'
      ? `You are in FULL DEPARTMENT DOSSIER & AUDIT mode. Provide complete, structured, real-world intelligence: eligibility numbers, policy compliance warnings, payout setup details, monetization mechanics, realistic timeline, and common pitfalls to avoid.`
      : `You are in DELIVERABLE & TEMPLATE BUILDER mode. Write ready-to-use, client-ready outputs: exact Fiverr gig descriptions, Upwork proposals, viral video hooks/scripts, n8n node architectures/JSON expressions, or content calendars tailored to the user's niche.`;

  const activeStepContext = payload.activeStepTitle
    ? `\nCurrently focused course step:\n- Step: ${payload.activeStepTitle}\n- Core Instructions: ${payload.activeStepInstructions || 'N/A'}`
    : '';

  return [
    `You are the senior practitioner mentor inside "#PGL.03 (Earning Guide by ArYan JAN BaLocH)", an execution-focused Earning Guide & Training Platform for Freelancing, Social Media Monetization (YouTube, Facebook, Instagram, TikTok), n8n AI Automation, and Digital Online Earning.`,
    `Active Income Track: ${payload.departmentTitle} (${payload.departmentId})`,
    `Track Overview: ${payload.departmentSummary}${activeStepContext}`,
    languageDirective,
    modeDirective,
    `Formatting Rules:`,
    `- Use clean Markdown headings (###), numbered step lists, and concise bullet points.`,
    `- When providing n8n JSON, webhook payloads, scripts, or prompts, wrap them in fenced code blocks (\`\`\`json or \`\`\`text).`,
    `- Be honest and grounded about platform policies (originality rules, country eligibility, payout compliance, AdSense/Meta/TikTok verification). Never promise overnight guaranteed money; focus on real execution, client value, and compliant monetization.`,
    `- Keep answers practical, crisp, and actionable.`,
  ].join('\n\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: '#PGL.03 — Earning Guide by ArYan JAN BaLocH' });
  });

  app.post('/api/content/generate', async (req: Request, res: Response) => {
    const body = req.body as ContentGenerateRequest;
    if (!body || !body.topic || !body.topic.trim()) {
      res.status(400).json({ error: 'Please provide a topic or niche.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const langRule =
      body.languageMode === 'roman_urdu'
        ? 'Write the hook, script, caption, and policyCheckNotes in clear natural Roman Urdu, while keeping thumbnailHeadline short and punchy (2-4 words in English or Roman Urdu).'
        : body.languageMode === 'bilingual'
        ? 'Write script and caption in clean English + Roman Urdu mix for maximum clarity.'
        : 'Write all copy in crisp, high-converting English.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate a ready-to-publish content production kit for platform track "${body.trackTitle}" (${body.targetFormat}) about the topic: "${body.topic.trim()}". ${langRule}`,
        config: {
          systemInstruction:
            'You are a senior creator strategist and monetization compliance expert. Produce practical, non-clickbait, policy-safe scripts and visual thumbnail copy.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: {
                type: Type.STRING,
                description: 'First 3-second attention hook.',
              },
              script: {
                type: Type.STRING,
                description:
                  'Step-by-step spoken or on-screen script broken into clear beat timestamps.',
              },
              caption: {
                type: Type.STRING,
                description: 'Publish-ready post caption with a clear call to action.',
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 to 7 relevant hashtags.',
              },
              thumbnailHeadline: {
                type: Type.STRING,
                description: 'Short 2 to 4 word high-contrast headline for the thumbnail/post image.',
              },
              thumbnailSubtext: {
                type: Type.STRING,
                description: 'Concise 4 to 7 word supporting line for the image.',
              },
              policyCheckNotes: {
                type: Type.STRING,
                description:
                  'Specific platform originality/monetization safety reminder for this piece.',
              },
            },
            required: [
              'hook',
              'script',
              'caption',
              'hashtags',
              'thumbnailHeadline',
              'thumbnailSubtext',
              'policyCheckNotes',
            ],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate AI content kit.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/mentor/chat', async (req: Request, res: Response) => {
    const body = req.body as MentorChatRequest;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Please provide at least one message.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const systemInstruction = buildSystemInstruction(body);
      const contents = body.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          sendEvent('chunk', { text: chunk.text });
        }
      }

      sendEvent('done', { finished: true });
      res.end();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate AI mentor response.';
      const status =
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status
          : 500;

      if (!res.headersSent) {
        res.status(status).json({ error: message });
        return;
      }

      sendEvent('error', { error: message, status });
      res.end();
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found. Run npm run build first.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`#PGL.03 listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failure:', err);
  process.exit(1);
});
