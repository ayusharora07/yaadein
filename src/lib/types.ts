// ============================================================
// Yaadein — Core TypeScript Types
// ============================================================

export interface User {
  _id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Circle {
  _id: string;
  name: string;
  description?: string;
  emoji: string;
  code: string; // invite code
  members: CircleMember[];
  createdBy: string;
  createdAt: Date;
}

export interface CircleMember {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
}

// --- Moments ---

export type MomentType = 'text' | 'photo' | 'voice';

export interface Moment {
  _id: string;
  circleId: string;
  createdBy: string;
  creatorName: string;
  type: MomentType;
  content: string; // text content or caption
  mediaUrl?: string; // photo URL or voice recording URL
  transcript?: string; // voice transcript via ElevenLabs
  tags?: string[];
  reactions?: Reaction[];
  embedding?: number[]; // vector embedding for semantic search
  createdAt: Date;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

// --- Slam Book ---

export interface SlamBook {
  _id: string;
  circleId: string;
  createdBy: string;
  title: string;
  description?: string;
  prompts: SlamBookPrompt[];
  entries: SlamBookEntry[];
  isAIGenerated: boolean; // whether prompts were AI-generated
  createdAt: Date;
}

export interface SlamBookPrompt {
  id: string;
  question: string;
  category?: 'fun' | 'nostalgic' | 'deep' | 'quirky';
}

export interface SlamBookEntry {
  userId: string;
  userName: string;
  answers: SlamBookAnswer[];
  completedAt: Date;
}

export interface SlamBookAnswer {
  promptId: string;
  answer: string;
  isVoice?: boolean; // answered via voice
}

// --- Time Capsule ---

export type CapsuleStatus = 'open' | 'sealed' | 'unlocked';

export interface Capsule {
  _id: string;
  circleId: string;
  createdBy: string;
  creatorName: string;
  title: string;
  description?: string;
  status: CapsuleStatus;
  unlockAt: Date;
  sealedAt?: Date;
  unlockedAt?: Date;
  contributions: CapsuleContribution[];
  narrationUrl?: string; // ElevenLabs TTS narration
  aiSummary?: string; // AI-generated capsule story
  workflowId?: string; // Temporal workflow ID
  createdAt: Date;
}

export interface CapsuleContribution {
  id: string;
  userId: string;
  userName: string;
  type: 'text' | 'photo' | 'voice';
  content: string;
  mediaUrl?: string;
  addedAt: Date;
}

// --- AI Memory Curator ---

export interface MemoryStory {
  _id: string;
  circleId: string;
  query: string;
  memories: string[]; // moment IDs used
  timeline: MemoryTimelineEntry[];
  narrative: string;
  createdAt: Date;
}

export interface MemoryTimelineEntry {
  date: Date;
  title: string;
  summary: string;
  momentId?: string;
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
