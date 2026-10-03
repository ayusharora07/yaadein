import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// User Model
// ============================================================

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '👤' },
  createdAt: { type: Date, default: Date.now },
});

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
}

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

// ============================================================
// Circle Model
// ============================================================

const CircleMemberSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  avatar: String,
  joinedAt: { type: Date, default: Date.now },
});

const CircleSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  emoji: { type: String, default: '✨' },
  code: { type: String, required: true, unique: true, index: true },
  members: [CircleMemberSchema],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export interface CircleDocument extends Document {
  name: string;
  description?: string;
  emoji: string;
  code: string;
  members: Array<{
    userId: string;
    name: string;
    email?: string;
    avatar?: string;
    joinedAt: Date;
  }>;
  createdBy: string;
  createdAt: Date;
}

export const CircleModel = mongoose.models.Circle || mongoose.model<CircleDocument>('Circle', CircleSchema);

// ============================================================
// Moment Model & Comment Model
// ============================================================

const ReactionSchema = new Schema({
  userId: String,
  emoji: String,
});

const MomentSchema = new Schema({
  circleId: { type: String, required: true, index: true },
  createdBy: { type: String, required: true },
  creatorName: { type: String, required: true },
  type: { type: String, enum: ['text', 'photo', 'voice'], default: 'text' },
  content: { type: String, required: true },
  mediaUrl: String,
  transcript: String,
  tags: [String],
  reactions: [ReactionSchema],
  embedding: [Number],
  createdAt: { type: Date, default: Date.now },
});

MomentSchema.index({ content: 'text', tags: 'text' });

export interface MomentDocument extends Document {
  circleId: string;
  createdBy: string;
  creatorName: string;
  type: 'text' | 'photo' | 'voice';
  content: string;
  mediaUrl?: string;
  transcript?: string;
  tags?: string[];
  reactions?: Array<{ userId: string; emoji: string }>;
  embedding?: number[];
  createdAt: Date;
}

export const MomentModel = mongoose.models.Moment || mongoose.model<MomentDocument>('Moment', MomentSchema);

const CommentSchema = new Schema({
  momentId: { type: String, required: true, index: true },
  circleId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export interface CommentDocument extends Document {
  momentId: string;
  circleId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export const CommentModel = mongoose.models.Comment || mongoose.model<CommentDocument>('Comment', CommentSchema);

// ============================================================
// Circle Group Chat Model
// ============================================================

const ChatMessageSchema = new Schema({
  circleId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  mediaUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export interface ChatMessageDocument extends Document {
  circleId: string;
  senderId: string;
  senderName: string;
  content: string;
  mediaUrl?: string;
  createdAt: Date;
}

export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model<ChatMessageDocument>('ChatMessage', ChatMessageSchema);

// ============================================================
// SlamBook Model
// ============================================================

const SlamBookPromptSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  category: { type: String, enum: ['fun', 'nostalgic', 'deep', 'quirky'] },
});

const SlamBookAnswerSchema = new Schema({
  promptId: { type: String, required: true },
  answer: { type: String, required: true },
  isVoice: { type: Boolean, default: false },
});

const SlamBookEntrySchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  answers: [SlamBookAnswerSchema],
  completedAt: { type: Date, default: Date.now },
});

const SlamBookSchema = new Schema({
  circleId: { type: String, required: true, index: true },
  createdBy: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  prompts: [SlamBookPromptSchema],
  entries: [SlamBookEntrySchema],
  isPrivate: { type: Boolean, default: false },
  isAIGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export interface SlamBookDocument extends Document {
  circleId: string;
  createdBy: string;
  title: string;
  description?: string;
  prompts: Array<{ id: string; question: string; category?: string }>;
  entries: Array<{
    userId: string;
    userName: string;
    answers: Array<{ promptId: string; answer: string; isVoice?: boolean }>;
    completedAt: Date;
  }>;
  isPrivate: boolean;
  isAIGenerated: boolean;
  createdAt: Date;
}

export const SlamBookModel = mongoose.models.SlamBook || mongoose.model<SlamBookDocument>('SlamBook', SlamBookSchema);

// ============================================================
// Capsule Model
// ============================================================

const CapsuleContributionSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  type: { type: String, enum: ['text', 'photo', 'voice'], default: 'text' },
  content: { type: String, required: true },
  mediaUrl: String,
  addedAt: { type: Date, default: Date.now },
});

const CapsuleSchema = new Schema({
  circleId: { type: String, required: true, index: true },
  createdBy: { type: String, required: true },
  creatorName: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['open', 'sealed', 'unlocked'], default: 'open' },
  unlockAt: { type: Date, required: true },
  sealedAt: Date,
  unlockedAt: Date,
  contributions: [CapsuleContributionSchema],
  narrationUrl: String,
  aiSummary: String,
  workflowId: String,
  createdAt: { type: Date, default: Date.now },
});

export interface CapsuleDocument extends Document {
  circleId: string;
  createdBy: string;
  creatorName: string;
  title: string;
  description?: string;
  status: 'open' | 'sealed' | 'unlocked';
  unlockAt: Date;
  sealedAt?: Date;
  unlockedAt?: Date;
  contributions: Array<{
    id: string;
    userId: string;
    userName: string;
    type: 'text' | 'photo' | 'voice';
    content: string;
    mediaUrl?: string;
    addedAt: Date;
  }>;
  narrationUrl?: string;
  aiSummary?: string;
  workflowId?: string;
  createdAt: Date;
}

export const CapsuleModel = mongoose.models.Capsule || mongoose.model<CapsuleDocument>('Capsule', CapsuleSchema);

// ============================================================
// MemoryStory Model
// ============================================================

const MemoryTimelineEntrySchema = new Schema({
  date: Date,
  title: String,
  summary: String,
  momentId: String,
});

const MemoryStorySchema = new Schema({
  circleId: { type: String, required: true, index: true },
  query: { type: String, required: true },
  memories: [String],
  timeline: [MemoryTimelineEntrySchema],
  narrative: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export interface MemoryStoryDocument extends Document {
  circleId: string;
  query: string;
  memories: string[];
  timeline: Array<{ date: Date; title: string; summary: string; momentId?: string }>;
  narrative: string;
  createdAt: Date;
}

export const MemoryStoryModel = mongoose.models.MemoryStory || mongoose.model<MemoryStoryDocument>('MemoryStory', MemoryStorySchema);
