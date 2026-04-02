# AI Cofounder - Your AI Startup Partner

AI Cofounder is your AI partner that helps first-time founders solve the major challenges of dealing with investors and growing their startup journey from idea to funding in seconds.

## Features

- **AI Idea Analysis**: Powered by Groq (Llama 3 8B) for deep market insights.
- **Market Research**: Instant market size, competitor analysis, and opportunity scoring.
- **Pitch Deck Generator**: Structured 10-slide pitch deck outlines ready to download.
- **Investor Map**: Find local investors in major Indian cities (Delhi NCR, Mumbai, Bangalore, etc.).
- **Meeting Scheduler**: Book meetings with investors via Google Meet or in-person.
- **Email Sender**: AI-generated professional investor email drafts with sender UI.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend**: Express.js with Vite HMR support
- **AI**: Groq API (Llama 3.1 8B Instant)
- **Maps**: React Leaflet + Google Maps integration
- **Video**: Daily.co API for instant meeting rooms
- **Email**: Resend API integration
- **Icons**: Lucide React
- **Animations**: Framer Motion + Canvas Confetti
- **Presentations**: PPTXGenJS for downloadable decks

## 🚀 Quick Setup (2 minutes)

1. **Get Groq API Key** (Free tier available):

   ```
   https://console.groq.com/keys
   ```

2. **Add to `.env`**:

   ```
   GROQ_API_KEY=your_groq_key_here
   ```

3. **Run the app**:

   ```
   npm run dev
   ```

4. **Open** `http://localhost:3000`

## 💎 Design System

- **Primary**: Deep Navy `#0A0F2C`
- **Accent**: Electric Blue `#3B82F6`
- **Typography**: Inter (400,500,600,700)
- **Style**: Minimal, Dark Mode, Premium (Linear/Vercel inspired)

## 🌐 Live Demo Features

- Zero-API pitch deck generator (offline mock engine)
- Interactive investor map with real coordinates
- Meeting scheduler with Daily.co integration
- Professional email composer
- Responsive design (mobile-first)

## 🔮 Next Features Coming

- [ ] Real Groq API integration
- [ ] Firebase auth persistence
- [ ] Export to Canva/PowerPoint
- [ ] WhatsApp investor outreach
- [ ] Hindi language support

---

_Built for Indian startup founders. Idea to investor meeting in under 60 seconds._
