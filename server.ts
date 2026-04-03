import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Groq from "groq-sdk";
import { Resend } from "resend";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// API Key Validation
function getFirstEnv(...keys: string[]) {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw && raw.trim()) {
      return raw.trim().replace(/^['\"]|['\"]$/g, "");
    }
  }
  return "";
}

const GROQ_KEY = getFirstEnv(
  "GROQ_API_KEY",
  "Aicofounder",
  "AICofounder",
  "AICOFOUNDER",
  "GROQ_KEY",
  "API_KEY"
);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DAILY_API_KEY = process.env.DAILY_API_KEY;

if (!GROQ_KEY) {
  console.error(
    "ERROR: Groq API key missing. Set one of: GROQ_API_KEY, Aicofounder, AICofounder, AICOFOUNDER, GROQ_KEY, API_KEY"
  );
}

const groq = new Groq({
  apiKey: GROQ_KEY || "",
});

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function generateDailyRoom() {
  if (!DAILY_API_KEY) {
    console.warn("DAILY_API_KEY is missing. Returning a placeholder link.");
    return `https://founderai.daily.co/meeting-${Math.random().toString(36).substring(7)}`;
  }

  try {
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          exp: Math.round(Date.now() / 1000) + 3600 * 24, // Expire in 24 hours
          enable_chat: true,
        },
      }),
    });

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Daily.co API Error:", error);
    return `https://founderai.daily.co/fallback-${Math.random().toString(36).substring(7)}`;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const APP_HOSTNAME = (process.env.APP_HOSTNAME || "localhost")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  app.use(express.json());
  app.use(cors());

  // Security headers for production
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://apis.google.com", "https://*.firebaseapp.com"],
          "img-src": ["'self'", "data:", "https:", "http:", "https://*.tile.openstreetmap.org", "https://*.google.com", "https://*.googleusercontent.com"],
          "connect-src": ["'self'", "https:", "http:", "ws:", "wss:", "https://*.googleapis.com", "https://*.firebaseapp.com"],
          "frame-src": ["'self'", "https://*.firebaseapp.com"],
        },
      },
    })
  );

  // Rate limiting to prevent API abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiter to API routes only
  app.use("/api/", limiter);

  app.get("/api/debug-env", (req, res) => {
    res.json({ keys: Object.keys(process.env) });
  });

  app.post("/api/generate-slides", async (req, res) => {
    const { idea, currentSlidesCount, additionalCount } = req.body;

    if (!GROQ_KEY) {
      return res.status(500).json({ error: "Groq API key is not configured" });
    }

    const systemPrompt = `You are an expert startup pitch deck consultant.
Generate ${additionalCount} additional pitch deck slides for the given startup idea, starting from slide number ${currentSlidesCount + 1}.
Return ONLY valid JSON (no extra text) with this exact structure:
{
  "pitchSlides": [
    {"slideNumber": number, "title": "string", "content": "string"}
  ]
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Idea: ${idea}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq");
      res.json(JSON.parse(content));
    } catch (error) {
      console.error("Groq API Error:", error);
      res.status(500).json({ error: "Failed to generate additional slides" });
    }
  });

  // Groq API Proxy
  app.post("/api/generate", async (req, res) => {
    console.log("Received generation request for idea:", req.body.idea?.substring(0, 50));
    const { idea, city } = req.body;

    if (!GROQ_KEY) {
      console.error("Groq API key is missing from environment variables.");
      return res.status(500).json({ 
        error: "Groq API key is not configured. Set GROQ_API_KEY in .env and restart the dev server." 
      });
    }

    const systemPrompt = `You are an expert startup analyst for the Indian market.
Analyze the given startup idea for the city of ${city} and return ONLY valid JSON (no extra text) with this exact structure:
{
  "marketSize": "string (e.g. '$2.4B')",
  "marketAnalysisDetails": "string (detailed analysis of the market)",
  "competitors": [{"name": "string", "description": "string"}],
  "opportunityScore": number (1-10),
  "targetCustomer": "string",
  "revenueModel": "string",
  "pitchSlides": [
    {"slideNumber": number, "title": "string", "content": "string"}
  ],
  "investorEmail": {
    "subject": "string",
    "body": "string (professional 150-word email)"
  },
  "localInvestors": [{"name": "string", "address": "string", "uri": "string", "lat": number, "lng": number}]
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Idea: ${idea}\nCity: ${city}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error("Groq API returned empty content");
        return res.status(500).json({ error: "AI failed to generate a response. Please try again." });
      }
      
      try {
        const parsedContent = JSON.parse(content);
        res.json(parsedContent);
      } catch (parseError) {
        console.error("Failed to parse Groq content as JSON. Raw content:", content);
        res.status(500).json({ error: "AI returned malformed data. Please try a different idea." });
      }
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Internal server error during generation" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, body } = req.body;

    if (!resend) {
      return res.status(500).json({ error: "Resend API key is not configured" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "FounderAI <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        text: body,
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Email Sending Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/meetings/generate-link", async (req, res) => {
    try {
      const link = await generateDailyRoom();
      res.json({ link });
    } catch (error) {
      console.error("Failed to generate meeting link:", error);
      res.status(500).json({ error: "Failed to generate meeting link" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://${APP_HOSTNAME}:${PORT}`);
  });
}

startServer();
