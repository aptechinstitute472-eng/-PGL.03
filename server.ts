import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
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

interface LeaderboardAggregateRecord {
  participantId: string;
  anonAlias: string;
  month: string;
  monthlyTotalUsd: number;
  primaryTrackId: string;
  entryCount: number;
  updatedAt: string;
}

interface LeaderboardSyncRequest {
  participantId?: unknown;
  anonAlias?: unknown;
  month?: unknown;
  monthlyTotalUsd?: unknown;
  primaryTrackId?: unknown;
  entryCount?: unknown;
}

const LEADERBOARD_DATA_DIR = path.resolve(__dirname, 'data');
const LEADERBOARD_FILE = path.join(
  LEADERBOARD_DATA_DIR,
  'leaderboard-aggregates.json'
);

function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isValidMonthKey(val: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(val);
}

function isValidParticipantId(val: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(val);
}

function sanitizeAnonAlias(raw: string, participantId: string): string {
  const stripped = raw
    .replace(/@\S+/g, '')
    .replace(/[^a-zA-Z0-9 #_-]/g, '')
    .trim()
    .slice(0, 24);
  if (stripped.length >= 3) {
    return stripped;
  }
  const suffix = participantId.slice(-4).toUpperCase();
  return `Earner #${suffix}`;
}

function readLeaderboardStore(): LeaderboardAggregateRecord[] {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LeaderboardAggregateRecord =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as LeaderboardAggregateRecord).participantId === 'string' &&
        typeof (item as LeaderboardAggregateRecord).anonAlias === 'string' &&
        typeof (item as LeaderboardAggregateRecord).month === 'string' &&
        typeof (item as LeaderboardAggregateRecord).monthlyTotalUsd === 'number' &&
        typeof (item as LeaderboardAggregateRecord).primaryTrackId === 'string' &&
        typeof (item as LeaderboardAggregateRecord).entryCount === 'number'
    );
  } catch {
    return [];
  }
}

function writeLeaderboardStore(records: LeaderboardAggregateRecord[]): void {
  if (!fs.existsSync(LEADERBOARD_DATA_DIR)) {
    fs.mkdirSync(LEADERBOARD_DATA_DIR, { recursive: true });
  }
  const tempFile = `${LEADERBOARD_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tempFile, LEADERBOARD_FILE);
}

function buildLeaderboardPayload(
  records: LeaderboardAggregateRecord[],
  month: string,
  participantId?: string
) {
  const activeForMonth = records
    .filter((r) => r.month === month && r.monthlyTotalUsd > 0)
    .sort((a, b) => {
      if (b.monthlyTotalUsd !== a.monthlyTotalUsd) {
        return b.monthlyTotalUsd - a.monthlyTotalUsd;
      }
      if (b.entryCount !== a.entryCount) {
        return b.entryCount - a.entryCount;
      }
      return a.updatedAt.localeCompare(b.updatedAt);
    });

  const communityTotalUsd =
    Math.round(
      activeForMonth.reduce((sum, r) => sum + r.monthlyTotalUsd, 0) * 100
    ) / 100;

  const topFive = activeForMonth.slice(0, 5).map((rec, idx) => ({
    rank: idx + 1,
    anonAlias: rec.anonAlias,
    primaryTrackId: rec.primaryTrackId,
    monthlyTotalUsd: Math.round(rec.monthlyTotalUsd * 100) / 100,
    entryCount: rec.entryCount,
    updatedAt: rec.updatedAt,
    isCurrentUser: Boolean(participantId && rec.participantId === participantId),
  }));

  let currentUserPosition: {
    rank: number;
    anonAlias: string;
    primaryTrackId: string;
    monthlyTotalUsd: number;
    entryCount: number;
    gapToFirstUsd: number;
    gapToTopFiveUsd: number;
  } | null = null;

  if (participantId) {
    const idx = activeForMonth.findIndex(
      (r) => r.participantId === participantId
    );
    if (idx !== -1) {
      const me = activeForMonth[idx];
      const topUsd = activeForMonth[0]?.monthlyTotalUsd ?? me.monthlyTotalUsd;
      const fifthUsd =
        activeForMonth[4]?.monthlyTotalUsd ?? me.monthlyTotalUsd;
      currentUserPosition = {
        rank: idx + 1,
        anonAlias: me.anonAlias,
        primaryTrackId: me.primaryTrackId,
        monthlyTotalUsd: Math.round(me.monthlyTotalUsd * 100) / 100,
        entryCount: me.entryCount,
        gapToFirstUsd: Math.max(
          0,
          Math.round((topUsd - me.monthlyTotalUsd) * 100) / 100
        ),
        gapToTopFiveUsd:
          idx < 5
            ? 0
            : Math.max(
                0,
                Math.round((fifthUsd - me.monthlyTotalUsd) * 100) / 100
              ),
      };
    }
  }

  return {
    month,
    totalParticipants: activeForMonth.length,
    communityTotalUsd,
    topFive,
    currentUserPosition,
  };
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
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: '#PGL.03 — Earning Guide by ArYan JAN BaLocH' });
  });

  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const rawMonth =
      typeof req.query.month === 'string' ? req.query.month : getCurrentMonthKey();
    const month = isValidMonthKey(rawMonth) ? rawMonth : getCurrentMonthKey();
    const rawParticipantId =
      typeof req.query.participantId === 'string'
        ? req.query.participantId
        : undefined;
    const participantId =
      rawParticipantId && isValidParticipantId(rawParticipantId)
        ? rawParticipantId
        : undefined;

    const records = readLeaderboardStore();
    res.json(buildLeaderboardPayload(records, month, participantId));
  });

  app.post('/api/leaderboard/sync', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as LeaderboardSyncRequest;
    const participantId =
      typeof body.participantId === 'string' ? body.participantId.trim() : '';
    const rawMonth =
      typeof body.month === 'string' ? body.month.trim() : getCurrentMonthKey();
    const month = isValidMonthKey(rawMonth) ? rawMonth : '';

    if (!isValidParticipantId(participantId) || !month) {
      res.status(400).json({
        error: 'Valid anonymous participantId and YYYY-MM month are required.',
      });
      return;
    }

    const monthlyTotalUsd = Number(body.monthlyTotalUsd);
    const entryCount = Number(body.entryCount);
    if (
      !Number.isFinite(monthlyTotalUsd) ||
      monthlyTotalUsd < 0 ||
      !Number.isFinite(entryCount) ||
      entryCount < 0
    ) {
      res.status(400).json({ error: 'Invalid monthly aggregate totals.' });
      return;
    }

    const rawTrackId =
      typeof body.primaryTrackId === 'string' ? body.primaryTrackId.trim() : '';
    const primaryTrackId = /^[a-z0-9-]{1,32}$/.test(rawTrackId)
      ? rawTrackId
      : 'general';
    const rawAlias =
      typeof body.anonAlias === 'string' ? body.anonAlias : '';
    const anonAlias = sanitizeAnonAlias(rawAlias, participantId);

    const records = readLeaderboardStore().filter(
      (r) => !(r.participantId === participantId && r.month === month)
    );

    const roundedTotal = Math.round(monthlyTotalUsd * 100) / 100;
    const roundedCount = Math.floor(entryCount);

    if (roundedTotal > 0 && roundedCount > 0) {
      records.push({
        participantId,
        anonAlias,
        month,
        monthlyTotalUsd: roundedTotal,
        primaryTrackId,
        entryCount: roundedCount,
        updatedAt: new Date().toISOString(),
      });
    }

    writeLeaderboardStore(records);
    res.json(buildLeaderboardPayload(records, month, participantId));
  });

  app.delete('/api/leaderboard/sync', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { participantId?: unknown; month?: unknown };
    const participantId =
      typeof body.participantId === 'string'
        ? body.participantId.trim()
        : typeof req.query.participantId === 'string'
        ? req.query.participantId.trim()
        : '';
    const rawMonth =
      typeof body.month === 'string'
        ? body.month.trim()
        : typeof req.query.month === 'string'
        ? req.query.month.trim()
        : getCurrentMonthKey();
    const month = isValidMonthKey(rawMonth) ? rawMonth : getCurrentMonthKey();

    if (!isValidParticipantId(participantId)) {
      res.status(400).json({ error: 'Valid participantId is required.' });
      return;
    }

    const records = readLeaderboardStore().filter(
      (r) => !(r.participantId === participantId && r.month === month)
    );
    writeLeaderboardStore(records);
    res.json(buildLeaderboardPayload(records, month, participantId));
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

  app.post('/api/quiz/recommend', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      dailyHours?: string;
      strength?: string;
      cameraComfort?: string;
      device?: string;
      goalTimeline?: string;
      languageMode?: string;
      availableTracks?: Array<{
        id: string;
        title: string;
        timeToFirstDollar: string;
        earningModel: string;
      }>;
    };

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const trackListText = Array.isArray(body.availableTracks)
      ? body.availableTracks
          .map(
            (t) =>
              `- ${t.id}: ${t.title} (${t.timeToFirstDollar}, Model: ${t.earningModel})`
          )
          .join('\n')
      : '- youtube, facebook, instagram, tiktok, n8n, freelancing, video-ugc, digital-commerce';

    const langDirective =
      body.languageMode === 'roman_urdu'
        ? 'Write headline, rationale, and all 7 firstWeekPlan steps in clear, natural Roman Urdu.'
        : 'Write headline, rationale, and all 7 firstWeekPlan steps in crisp English with friendly operational clarity.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Recommend the single best earning track from the list below for this user profile:
- Daily Hours: ${body.dailyHours ?? '2-3 hours'}
- Strength: ${body.strength ?? 'Tech & AI'}
- Camera Comfort: ${body.cameraComfort ?? 'Faceless'}
- Device: ${body.device ?? 'Laptop'}
- Priority Goal: ${body.goalTimeline ?? 'Fast cashflow'}

Available Tracks:
${trackListText}

${langDirective}`,
        config: {
          systemInstruction:
            'You are a pragmatic career & monetization advisor for #PGL.03 Earning Guide. Always select recommendedTrackId and runnerUpTrackId strictly from the provided track IDs, give realistic USD targets (never exaggerated promises), and produce exactly 7 concrete daily starter steps.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedTrackId: {
                type: Type.STRING,
                description:
                  'Exact track id from the provided list (e.g. n8n, freelancing, youtube, facebook, instagram, tiktok, video-ugc, digital-commerce).',
              },
              runnerUpTrackId: {
                type: Type.STRING,
                description: 'Second best track id from the provided list.',
              },
              matchScore: {
                type: Type.INTEGER,
                description: 'Match percentage between 78 and 98.',
              },
              headline: {
                type: Type.STRING,
                description: 'Short 1-sentence reason why this track fits.',
              },
              rationale: {
                type: Type.STRING,
                description:
                  '2-3 sentences explaining device/time/strength alignment and monetization path.',
              },
              firstWeekPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 7 specific action items for Day 1 through Day 7.',
              },
              estimated30DayTarget: {
                type: Type.STRING,
                description: 'Realistic Day 30 target string, e.g. $150 - $400 USD.',
              },
              estimated90DayTarget: {
                type: Type.STRING,
                description: 'Realistic Day 90 target string, e.g. $800 - $1,800 USD.',
              },
            },
            required: [
              'recommendedTrackId',
              'runnerUpTrackId',
              'matchScore',
              'headline',
              'rationale',
              'firstWeekPlan',
              'estimated30DayTarget',
              'estimated90DayTarget',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err: unknown) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to generate AI track recommendation.',
      });
    }
  });

  app.post('/api/enrollments', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const buyerName =
      typeof body.buyerName === 'string' ? body.buyerName.trim() : '';
    const buyerContact =
      typeof body.buyerContact === 'string' ? body.buyerContact.trim() : '';
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const planName =
      typeof body.planName === 'string' ? body.planName.trim() : '';

    if (!buyerName || !buyerContact || !planId || !planName) {
      res.status(400).json({
        error: 'Name, contact, and plan selection are required.',
      });
      return;
    }

    const ticketCode = `PGL-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const record = {
      id: `enr_${Date.now()}`,
      ticketCode,
      planId,
      planName,
      priceUsd: typeof body.priceUsd === 'string' ? body.priceUsd : '$49',
      pricePkr: typeof body.pricePkr === 'string' ? body.pricePkr : 'Rs. 13,500',
      buyerName: buyerName.slice(0, 120),
      buyerContact: buyerContact.slice(0, 120),
      preferredTrack:
        typeof body.preferredTrack === 'string'
          ? body.preferredTrack.slice(0, 120)
          : 'YouTube',
      paymentMethod:
        typeof body.paymentMethod === 'string'
          ? body.paymentMethod.slice(0, 80)
          : 'JazzCash / Easypaisa',
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    try {
      const enrollmentsFile = path.join(LEADERBOARD_DATA_DIR, 'enrollments.json');
      if (!fs.existsSync(LEADERBOARD_DATA_DIR)) {
        fs.mkdirSync(LEADERBOARD_DATA_DIR, { recursive: true });
      }
      let existing: unknown[] = [];
      if (fs.existsSync(enrollmentsFile)) {
        const parsed = JSON.parse(fs.readFileSync(enrollmentsFile, 'utf8'));
        if (Array.isArray(parsed)) existing = parsed;
      }
      existing.unshift(record);
      fs.writeFileSync(
        enrollmentsFile,
        JSON.stringify(existing.slice(0, 200), null, 2),
        'utf8'
      );
      res.status(201).json(record);
    } catch {
      res.status(500).json({ error: 'Unable to record enrollment request.' });
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
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`#PGL.03 listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failure:', err);
  process.exit(1);
});
