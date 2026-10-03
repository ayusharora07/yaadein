# Yaadein (यादें) — Memories with Friends

> A friendship memory platform — share **Moments**, fill **Slam Books**, and seal **Time Capsules** together. Powered by open-source AI.

Built for [Hacktoberfest 2026 — DEV Challenge 1: Build for a Friend](https://dev.to/challenges/hacktoberfest2026).

---

## The Story

After college, our friend group scattered across cities. WhatsApp groups went silent. Instagram stories became performances, not conversations. The slam books we filled in our last semester got lost. The inside jokes faded.

**Yaadein** ("memories" in Hindi) is what I wished existed — a private space where friends can:

- **Share Moments** — text, photos, voice notes that only your circle sees
- **Fill Slam Books** — AI-generated prompts that go beyond generic questions
- **Seal Time Capsules** — lock memories today, open them years from now

It's not social media. There are no followers, no likes, no algorithms. Just you and the people who matter.

---

## Why Open-Source AI?

Friends' memories are private. They don't belong on someone else's server, processed by someone else's model.

Yaadein runs on **Google's Gemma** (open-weight) via **Ollama** — meaning the AI layer can be self-hosted. Your memories, your data, your model.

### What the AI does:

| Feature | AI Role | Model |
|---|---|---|
| Slam Book Prompts | Generates personalized, context-aware questions | Gemma 3 4B |
| Memory Curator | Searches memories and weaves them into stories | Gemma 3 4B |
| Capsule Narratives | Summarizes capsule contents when unlocked | Gemma 3 4B |
| Voice Transcription | Converts voice moments to searchable text | ElevenLabs Scribe |
| Memory Search | Semantic retrieval across all moments | MongoDB Atlas Vector Search |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | App Router, Server Components |
| **AI Model** | Gemma 3 4B via Ollama | Open-weight LLM for all AI features |
| **Database** | MongoDB Atlas | Semi-structured data + Vector Search |
| **Workflows** | Temporal | Durable capsule lifecycle (seal → wait → unlock) |
| **Voice** | ElevenLabs | Speech-to-text + text-to-speech narration |
| **Hosting** | Render | Backend + AI runtime |
| **Observability** | Sentry Agent Tracing | AI pipeline debugging |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Ollama](https://ollama.com/) (for AI features)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/yaadein.git
cd yaadein

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Pull the Gemma model (for AI features)
ollama pull gemma3:4b

# Start development server
npm run dev
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/yaadein
OLLAMA_URL=http://localhost:11434
ELEVENLABS_API_KEY=      # Optional: for voice features
SENTRY_DSN=              # Optional: for observability
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Without AI

Yaadein works gracefully without Ollama/Gemma. AI features fall back to curated defaults:
- Slam Book uses 10 hand-picked prompts
- Memory Curator shows results without narrative
- Capsules skip AI summaries

---

## Architecture

```
                          USER
                            │
                            ▼
                   ┌─────────────────┐
                   │  NEXT.JS APP    │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         MOMENTS       SLAM BOOK      CAPSULES
              │             │             │
              └─────────────┼─────────────┘
                            │
                   ┌────────┴────────┐
                   │   BACKEND API   │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    MongoDB Atlas      Gemma + Ollama      Temporal
    (Data + Vector)    (AI Layer)          (Workflows)
```

---

## Features

### 🔮 Moments
Share text, photos, and voice memories within your friend circle. Search through memories semantically — ask "memories from our last hackathon" even if nobody used those exact words.

### 📖 Slam Book
AI-generated prompts that are specific, personal, and emotionally engaging. Fill them one at a time in a card-based interface, then see how everyone answered.

### 💊 Time Capsules
Create a capsule, have friends contribute memories, seal it, and set an unlock date. The capsule lifecycle is modeled as a durable workflow — it survives server restarts, deployments, and years of waiting.

### 🧠 AI Memory Curator
Ask the AI to weave your memories into a story. "Build a story from our college days" → the curator retrieves relevant moments, groups them by theme, and generates a warm narrative with a timeline.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Hacktoberfest 2026

This project was built for DEV Challenge 1: "Build for a Friend" as part of Hacktoberfest 2026.

**Why open innovation matters:** Friends' memories are deeply personal. Open-weight models like Gemma mean this tool can run entirely on your own hardware — no data leaves your control. Open-source means any friend group can fork, customize, and self-host their own instance.

---

Built with ❤️ for the friends who shaped me.
