import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yaadein';

// Define schemas directly for script
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '👤' },
  createdAt: { type: Date, default: Date.now },
});

const CircleMemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  avatar: String,
  joinedAt: { type: Date, default: Date.now },
});

const CircleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  emoji: { type: String, default: '✨' },
  code: { type: String, required: true, unique: true },
  members: [CircleMemberSchema],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const MomentSchema = new mongoose.Schema({
  circleId: { type: String, required: true },
  createdBy: { type: String, required: true },
  creatorName: { type: String, required: true },
  type: { type: String, enum: ['text', 'photo', 'voice'], default: 'text' },
  content: { type: String, required: true },
  mediaUrl: String,
  transcript: String,
  tags: [String],
  reactions: [{ userId: String, emoji: String }],
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  momentId: { type: String, required: true },
  circleId: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatMessageSchema = new mongoose.Schema({
  circleId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  mediaUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const SlamBookPromptSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  category: { type: String, enum: ['fun', 'nostalgic', 'deep', 'quirky'] },
});

const SlamBookAnswerSchema = new mongoose.Schema({
  promptId: { type: String, required: true },
  answer: { type: String, required: true },
  isVoice: { type: Boolean, default: false },
});

const SlamBookEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  answers: [SlamBookAnswerSchema],
  completedAt: { type: Date, default: Date.now },
});

const SlamBookSchema = new mongoose.Schema({
  circleId: { type: String, required: true },
  createdBy: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  prompts: [SlamBookPromptSchema],
  entries: [SlamBookEntrySchema],
  isPrivate: { type: Boolean, default: false },
  isAIGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const CapsuleContributionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  type: { type: String, enum: ['text', 'photo', 'voice'], default: 'text' },
  content: { type: String, required: true },
  mediaUrl: String,
  addedAt: { type: Date, default: Date.now },
});

const CapsuleSchema = new mongoose.Schema({
  circleId: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Circle = mongoose.models.Circle || mongoose.model('Circle', CircleSchema);
const Moment = mongoose.models.Moment || mongoose.model('Moment', MomentSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
const SlamBook = mongoose.models.SlamBook || mongoose.model('SlamBook', SlamBookSchema);
const Capsule = mongoose.models.Capsule || mongoose.model('Capsule', CapsuleSchema);

async function seed() {
  console.log('Connecting to MongoDB...', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { family: 4 });

  console.log('Wiping previous test collections...');
  await User.deleteMany({ email: { $in: ['a@gmail.com', 'rohan@gmail.com', 'priya@gmail.com', 'sneha@gmail.com', 'vikram@gmail.com'] } });
  await Circle.deleteMany({ code: { $in: ['COLLEGE2024', 'GOATRIP', 'TECHPIONEERS'] } });
  await Moment.deleteMany({});
  await Comment.deleteMany({});
  await ChatMessage.deleteMany({});
  await SlamBook.deleteMany({});
  await Capsule.deleteMany({});

  console.log('Creating Demo Users...');
  const users = await User.insertMany([
    { name: 'Ayush Arora', email: 'a@gmail.com', password: 'password123', avatar: '👨‍💻' },
    { name: 'Rohan Sharma', email: 'rohan@gmail.com', password: 'password123', avatar: '👦' },
    { name: 'Priya Patel', email: 'priya@gmail.com', password: 'password123', avatar: '👧' },
    { name: 'Sneha Roy', email: 'sneha@gmail.com', password: 'password123', avatar: '👩' },
    { name: 'Vikram Malhotra', email: 'vikram@gmail.com', password: 'password123', avatar: '🧑' },
  ]);

  const ayush = users[0];
  const rohan = users[1];
  const priya = users[2];
  const sneha = users[3];
  const vikram = users[4];

  console.log('Creating Demo Circles...');
  const circle1 = await Circle.create({
    name: 'College Squad 2024 🎓',
    description: 'The official group for our college gang! Nostalgia, memories, and fun.',
    emoji: '🎓',
    code: 'COLLEGE2024',
    createdBy: ayush._id.toString(),
    members: [
      { userId: ayush._id.toString(), name: ayush.name, email: ayush.email, avatar: ayush.avatar },
      { userId: rohan._id.toString(), name: rohan.name, email: rohan.email, avatar: rohan.avatar },
      { userId: priya._id.toString(), name: priya.name, email: priya.email, avatar: priya.avatar },
      { userId: sneha._id.toString(), name: sneha.name, email: sneha.email, avatar: sneha.avatar },
      { userId: vikram._id.toString(), name: vikram.name, email: vikram.email, avatar: vikram.avatar },
    ],
  });

  const circle2 = await Circle.create({
    name: 'Goa Trip Memories 🏖️',
    description: 'Sun, sand, and unforgettable vibes from Goa 2024!',
    emoji: '🏖️',
    code: 'GOATRIP',
    createdBy: rohan._id.toString(),
    members: [
      { userId: ayush._id.toString(), name: ayush.name, email: ayush.email, avatar: ayush.avatar },
      { userId: rohan._id.toString(), name: rohan.name, email: rohan.email, avatar: rohan.avatar },
      { userId: priya._id.toString(), name: priya.name, email: priya.email, avatar: priya.avatar },
    ],
  });

  const circle3 = await Circle.create({
    name: 'Tech Pioneers ⚡',
    description: 'Late night coding sessions, hackathons, and AI projects.',
    emoji: '⚡',
    code: 'TECHPIONEERS',
    createdBy: sneha._id.toString(),
    members: [
      { userId: ayush._id.toString(), name: ayush.name, email: ayush.email, avatar: ayush.avatar },
      { userId: sneha._id.toString(), name: sneha.name, email: sneha.email, avatar: sneha.avatar },
      { userId: vikram._id.toString(), name: vikram.name, email: vikram.email, avatar: vikram.avatar },
    ],
  });

  const circleId = circle1._id.toString();

  console.log('Creating Feed Moments...');
  const moment1 = await Moment.create({
    circleId: circleId,
    createdBy: ayush._id.toString(),
    creatorName: ayush.name,
    type: 'photo',
    content: 'Graduation Day memories with the best squad! Can\'t believe 4 years passed so fast 🎓✨',
    mediaUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
    tags: ['Graduation', 'SquadGoals', 'Nostalgia'],
    reactions: [
      { userId: rohan._id.toString(), emoji: '❤️' },
      { userId: priya._id.toString(), emoji: '🔥' },
      { userId: sneha._id.toString(), emoji: '🎉' },
      { userId: vikram._id.toString(), emoji: '👏' },
    ],
  });

  await Comment.create([
    {
      momentId: moment1._id.toString(),
      circleId: circleId,
      authorId: rohan._id.toString(),
      authorName: rohan.name,
      content: 'Best 4 years of my life! Canteen Maggi will be missed the most 🍜',
    },
    {
      momentId: moment1._id.toString(),
      circleId: circleId,
      authorId: priya._id.toString(),
      authorName: priya.name,
      content: 'Let\'s promise to meet every year no matter where we are! 🥹❤️',
    },
    {
      momentId: moment1._id.toString(),
      circleId: circleId,
      authorId: sneha._id.toString(),
      authorName: sneha.name,
      content: 'Love you all guys! 💖',
    },
  ]);

  const moment2 = await Moment.create({
    circleId: circleId,
    createdBy: rohan._id.toString(),
    creatorName: rohan.name,
    type: 'text',
    content: 'Late night study session at 3 AM before the final exams! Who else remembers drinking 5 cups of chai in Hostel 4? ☕📚',
    tags: ['CollegeLife', 'LateNight', 'Exams'],
    reactions: [
      { userId: ayush._id.toString(), emoji: '🔥' },
      { userId: priya._id.toString(), emoji: '❤️' },
    ],
  });

  await Comment.create({
    momentId: moment2._id.toString(),
    circleId: circleId,
    authorId: ayush._id.toString(),
    authorName: ayush.name,
    content: 'I literally slept on the table during the exam paper! 😂',
  });

  await Moment.create({
    circleId: circle2._id.toString(),
    createdBy: priya._id.toString(),
    creatorName: priya.name,
    type: 'photo',
    content: 'Sunset at Baga Beach, Goa 🌅 Best trip ever!',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop',
    tags: ['Goa2024', 'BeachVibes'],
    reactions: [
      { userId: ayush._id.toString(), emoji: '❤️' },
      { userId: rohan._id.toString(), emoji: '🔥' },
    ],
  });

  console.log('Creating Group Chat Messages...');
  await ChatMessage.create([
    {
      circleId: circleId,
      senderId: ayush._id.toString(),
      senderName: ayush.name,
      content: 'Hey everyone! Check out the new Slam Book I created for our circle 📖',
    },
    {
      circleId: circleId,
      senderId: rohan._id.toString(),
      senderName: rohan.name,
      content: 'Just filled mine! The questions are hilarious 😂',
    },
    {
      circleId: circleId,
      senderId: priya._id.toString(),
      senderName: priya.name,
      content: 'Also don\'t forget to listen to the AI voice narration in our unlocked Graduation Time Capsule! 🥹🔊',
    },
    {
      circleId: circleId,
      senderId: sneha._id.toString(),
      senderName: sneha.name,
      content: 'Listening right now! The voice narration sounds so real! 💖',
    },
  ]);

  console.log('Creating Slam Books...');
  await SlamBook.create({
    circleId: circleId,
    createdBy: ayush._id.toString(),
    title: 'Class of 2024 - Secret Confessions & Memories 📖',
    description: 'Fill in your memories, secrets, and predictions for our college squad!',
    isPrivate: false,
    isAIGenerated: false,
    prompts: [
      { id: 'p1', question: 'What is your favourite memory of our group?', category: 'nostalgic' },
      { id: 'p2', question: 'Who is most likely to become a billionaire?', category: 'fun' },
      { id: 'p3', question: 'One secret you never told anyone in college?', category: 'quirky' },
      { id: 'p4', question: 'Where do you see us in 5 years?', category: 'deep' },
    ],
    entries: [
      {
        userId: rohan._id.toString(),
        userName: rohan.name,
        answers: [
          { promptId: 'p1', answer: 'The overnight road trip to Lonavala when Ayush\'s car ran out of fuel!' },
          { promptId: 'p2', answer: 'Ayush for sure with his AI startup ideas 🚀' },
          { promptId: 'p3', answer: 'I was the one who hid Vikram\'s hostel keys on April Fool\'s day!' },
          { promptId: 'p4', answer: 'Sailing on our yachts near Dubai beach 🌊' },
        ],
        completedAt: new Date(),
      },
      {
        userId: priya._id.toString(),
        userName: priya.name,
        answers: [
          { promptId: 'p1', answer: 'Scribble day and signing everyone\'s shirts on the last day!' },
          { promptId: 'p2', answer: 'Sneha with her design empire 🎨' },
          { promptId: 'p3', answer: 'I failed my 2nd semester internal test but never told my parents 🤫' },
          { promptId: 'p4', answer: 'Still having late night gossip sessions on Zoom calls!' },
        ],
        completedAt: new Date(),
      },
      {
        userId: sneha._id.toString(),
        userName: sneha.name,
        answers: [
          { promptId: 'p1', answer: 'Canteen chai at 3 AM before final project submission!' },
          { promptId: 'p2', answer: 'Rohan! He is secretly a crypto mastermind 💡' },
          { promptId: 'p3', answer: 'I stole the canteen poster on our last day as a souvenir 🙈' },
          { promptId: 'p4', answer: 'Reunited in Goa celebrating our 30th birthdays!' },
        ],
        completedAt: new Date(),
      },
    ],
  });

  console.log('Creating Time Capsules...');
  const sampleAudio = 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg';

  await Capsule.create([
    {
      circleId: circleId,
      createdBy: ayush._id.toString(),
      creatorName: ayush.name,
      title: 'Graduation Vault 2024 ⏳',
      description: 'Our final memories unlocked for the entire squad to listen and remember!',
      status: 'unlocked',
      unlockAt: new Date(Date.now() - 86400000), // Yesterday (Unlocked)
      sealedAt: new Date(Date.now() - 30 * 86400000),
      unlockedAt: new Date(Date.now() - 86400000),
      contributions: [
        {
          id: 'c1',
          userId: ayush._id.toString(),
          userName: ayush.name,
          type: 'text',
          content: 'Today we write the last page of our college chapter. From awkward orientation day introductions to late night maggi sessions in hostel 4, we grew up together.',
          addedAt: new Date(Date.now() - 35 * 86400000),
        },
        {
          id: 'c2',
          userId: rohan._id.toString(),
          userName: rohan.name,
          type: 'text',
          content: 'Remembering our first hackathon victory at 4 AM! We coded non-stop with 5 energy drinks and won 1st prize.',
          addedAt: new Date(Date.now() - 34 * 86400000),
        },
        {
          id: 'c3',
          userId: priya._id.toString(),
          userName: priya.name,
          type: 'text',
          content: 'Signing off with memories that will last a lifetime. Here\'s to us, forever friends!',
          addedAt: new Date(Date.now() - 33 * 86400000),
        },
      ],
      aiSummary: 'A heartwarming recollection of the College Squad\'s 4-year journey — from nervous orientation introductions and 4 AM hackathon triumphs to late-night hostel maggi sessions and emotional graduation farewells.',
      narrationUrl: sampleAudio,
    },
    {
      circleId: circleId,
      createdBy: rohan._id.toString(),
      creatorName: rohan.name,
      title: 'Future Reunion Capsule 2026 🔒',
      description: 'Sealed memories to be opened on December 31, 2026!',
      status: 'sealed',
      unlockAt: new Date('2026-12-31T23:59:59Z'),
      sealedAt: new Date(),
      contributions: [
        {
          id: 's1',
          userId: sneha._id.toString(),
          userName: sneha.name,
          type: 'text',
          content: 'A letter to my future self and the squad! Hope we are all happy and thriving.',
          addedAt: new Date(),
        },
      ],
    },
  ]);

  console.log('🎉 Seed completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
