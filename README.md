# FounderAI - AI Co-Founder for Indian Startups

FounderAI is a premium, AI-powered platform designed to help first-time Indian founders go from idea to funding in seconds.

## Features
- **AI Idea Analysis**: Powered by Groq (Llama 3 8B) for deep market insights.
- **Market Research**: Instant market size, competitor analysis, and opportunity scoring.
- **Pitch Deck Generator**: Structured 10-slide pitch deck outlines.
- **Investor Map**: Find local investors in major Indian cities (Delhi NCR, Mumbai, Bangalore, etc.).
- **Email Sender**: AI-generated professional investor email drafts with a built-in sender UI.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Express (Node.js) for API proxying.
- **AI**: Groq API (Llama 3 8B).
- **Icons**: Lucide React.
- **Animations**: Framer Motion & Canvas Confetti.

## Setup & Local Development
1. Get a Groq API Key from [console.groq.com](https://console.groq.com/).
2. Add the key to your environment variables as `GROQ_API_KEY` (use `.env.example` as a template to create `.env`).
3. Run `npm install` and then `npm run dev` to start the development server.

## Production Deployment

This app is production-ready. You can deploy it to a platform like **Railway** or **Render** in just a few steps:

### Option 1: Railway (Recommended)
1. Commit all your latest code to a GitHub repository.
2. Go to [Railway.app](https://railway.app/) and create a new project from your GitHub repo.
3. In the Railway dashboard for your project, go to **Variables** and add all the necessary secrets from your `.env` file (e.g., `GROQ_API_KEY`, `RESEND_API_KEY`).
4. Railway will automatically detect the Node.js environment. It will run `npm install`, then `npm run build`, and finally use your `npm start` script to launch the app!
5. After the build completes, Railway will provide you with a live URL.

### Option 2: Render
1. Same as Railway—push your code to GitHub.
2. Go to [Render.com](https://render.com/) and create a new **Web Service**.
3. Point it to your GitHub repository.
4. Set the **Build Command** to `npm install && npm run build` and the **Start Command** to `npm start`.
5. Under the Environment tab, add your API keys.
6. Click Save and Deploy.

## Design System
- **Theme**: Deep Navy (#0A0F2C)
- **Accent**: Electric Blue (#3B82F6)
- **Typography**: Inter (Sans-serif)
- **Vibe**: Minimal, Dark, Premium (Linear/Vercel inspired)
