import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import {
  UserModel,
  CircleModel,
  MomentModel,
  CommentModel,
  ChatMessageModel,
  SlamBookModel,
  CapsuleModel,
} from '@/lib/models';
import { hashPassword } from '@/lib/auth-crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1. Clear existing demo data (or preserve if needed, but clean wipe gives pristine state for demo)
    await UserModel.deleteMany({ email: { $in: ['a@gmail.com', 'rohan@gmail.com', 'priya@gmail.com', 'sneha@gmail.com', 'vikram@gmail.com'] } });
    await CircleModel.deleteMany({ code: { $in: ['COLLEGE2024', 'GOATRIP', 'TECHPIONEERS'] } });
    await MomentModel.deleteMany({});
    await CommentModel.deleteMany({});
    await ChatMessageModel.deleteMany({});
    await SlamBookModel.deleteMany({});
    await CapsuleModel.deleteMany({});

    // 2. Create Users
    const defaultPasswordHash = hashPassword('password123');
    const users = await UserModel.insertMany([
      { name: 'Ayush Arora', email: 'a@gmail.com', password: defaultPasswordHash, avatar: '👨‍💻' },
      { name: 'Rohan Sharma', email: 'rohan@gmail.com', password: defaultPasswordHash, avatar: '👦' },
      { name: 'Priya Patel', email: 'priya@gmail.com', password: defaultPasswordHash, avatar: '👧' },
      { name: 'Sneha Roy', email: 'sneha@gmail.com', password: defaultPasswordHash, avatar: '👩' },
      { name: 'Vikram Malhotra', email: 'vikram@gmail.com', password: defaultPasswordHash, avatar: '🧑' },
    ]);

    const ayush = users[0];
    const rohan = users[1];
    const priya = users[2];
    const sneha = users[3];
    const vikram = users[4];

    // 3. Create Circles
    const circle1 = await CircleModel.create({
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

    const circle2 = await CircleModel.create({
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

    const circle3 = await CircleModel.create({
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

    // 4. Create Feed Moments (Posts)
    const moment1 = await MomentModel.create({
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

    await CommentModel.create([
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

    const moment2 = await MomentModel.create({
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

    await CommentModel.create({
      momentId: moment2._id.toString(),
      circleId: circleId,
      authorId: ayush._id.toString(),
      authorName: ayush.name,
      content: 'I literally slept on the table during the exam paper! 😂',
    });

    const moment3 = await MomentModel.create({
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

    // 5. Create Group Chat Messages
    await ChatMessageModel.create([
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

    // 6. Create Slam Books
    await SlamBookModel.create({
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

    // 7. Create Time Capsules (SHOWCASE UNLOCKED CAPSULE WITH AI NARRATION & SEALED CAPSULE)
    // Audio sample URL for realistic Voice Narration demonstration
    const sampleNarrationAudio = 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'; 

    await CapsuleModel.create([
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
        narrationUrl: sampleNarrationAudio,
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

    return NextResponse.json({
      success: true,
      message: 'Database successfully populated with rich demo data for showcase video!',
      credentials: {
        primaryUser: { name: 'Ayush Arora', email: 'a@gmail.com', password: 'password123' },
        friendUsers: [
          { name: 'Rohan Sharma', email: 'rohan@gmail.com', password: 'password123' },
          { name: 'Priya Patel', email: 'priya@gmail.com', password: 'password123' },
          { name: 'Sneha Roy', email: 'sneha@gmail.com', password: 'password123' },
          { name: 'Vikram Malhotra', email: 'vikram@gmail.com', password: 'password123' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}
