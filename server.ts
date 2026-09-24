import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Check if user has configured MONGODB_URI via environment secrets
function getMongoUri(): string | null {
  const raw = process.env.MONGODB_URI;
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();
  clean = clean.replace(/^(?:MONGODB_URI|DATABASE_URL)=\s*/i, '').trim();
  clean = clean.replace(/^["'`]|["'`]$/g, '').trim();
  const match = clean.match(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/i);
  if (match && match[0]) {
    return match[0];
  }
  return clean.startsWith('mongodb://') || clean.startsWith('mongodb+srv://') ? clean : null;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let mongoConnected = false;
let lastConnectAttemptTime = 0;
let connectPromise: Promise<Db | null> | null = null;
let loggedStorageNotice = false;
const RECONNECT_COOLDOWN_MS = 60000; // 60s cooldown between connection retries when unreachable

// Attempt connection to MongoDB Atlas with low timeout to avoid freezing requests
async function attemptConnect(): Promise<Db | null> {
  const activeUri = getMongoUri();
  if (!activeUri) {
    mongoConnected = false;
    mongoClient = null;
    db = null;
    if (!loggedStorageNotice) {
      loggedStorageNotice = true;
      console.log('⚡ Pokémon Arena: Running on high-performance Local & Persistent Storage engine.');
    }
    return null;
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(activeUri, {
        connectTimeoutMS: 3000,
        serverSelectionTimeoutMS: 3000,
      });
    }
    await mongoClient.connect();
    db = mongoClient.db('Pokemon_Arena');
    mongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas Database: Pokemon_Arena');

    // Create unique index on email and username
    try {
      await db.collection('trainers').createIndex({ email: 1 }, { unique: true });
      await db.collection('trainers').createIndex({ username: 1 }, { unique: true });
    } catch {
      // index might already exist
    }

    return db;
  } catch {
    mongoConnected = false;
    mongoClient = null;
    db = null;

    if (!loggedStorageNotice) {
      loggedStorageNotice = true;
      console.log('⚡ Pokémon Arena: Running on high-performance Local & Persistent Storage engine.');
    }
    return null;
  }
}

// Connect to MongoDB Atlas with non-blocking backoff cooldown
async function getDb(): Promise<Db | null> {
  if (db && mongoConnected) return db;

  // If a connection attempt is currently in-flight, await it
  if (connectPromise) {
    return connectPromise;
  }

  const now = Date.now();
  // If connection recently failed, fail fast to avoid stalling HTTP responses
  if (!mongoConnected && now - lastConnectAttemptTime < RECONNECT_COOLDOWN_MS) {
    return null;
  }

  lastConnectAttemptTime = now;
  connectPromise = attemptConnect();
  try {
    const result = await connectPromise;
    return result;
  } finally {
    connectPromise = null;
  }
}

interface SendEmailResult {
  sent: boolean;
  error?: string;
  configured: boolean;
}

// Unified email dispatch helper supporting Gmail App Passwords, Custom SMTP, Resend, and Brevo
async function sendOtpEmail(toEmail: string, otp: string, purpose: 'signup' | 'login'): Promise<SendEmailResult> {
  const isSignup = purpose === 'signup';
  const subject = isSignup
    ? `🎮 Your Pokémon Arena Verification Code: ${otp}`
    : `🔐 Your Pokémon Arena Login Verification Code: ${otp}`;
  const title = isSignup ? 'Trainer League Registration' : 'Trainer Login Verification';
  const instruction = isSignup
    ? 'Use the 6-digit one-time password below to verify your email and activate your Trainer Pass:'
    : 'Use the 6-digit one-time password below to log in to your Trainer Account:';

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: ${isSignup ? '#f43f5e' : '#38bdf8'}; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">⚡ Pokémon Arena</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">${title}</p>
      </div>

      <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px 0;">${instruction}</p>
        <div style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: #020617; padding: 12px 28px; border-radius: 8px; border: 2px solid #0284c7; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #64748b;">
        <p>Welcome to the ultimate Pokémon Silhouette Quiz & 1v1 Battle Arena!</p>
      </div>
    </div>
  `;

  const text = `Your Pokémon Arena verification code is: ${otp}. It will expire in 10 minutes.`;

  // 1. Gmail App Password or Gmail Service
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER?.includes('@gmail.com') ? process.env.SMTP_USER : undefined);
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || (gmailUser ? process.env.SMTP_PASS : undefined);

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Pokémon Arena League" <${gmailUser}>`,
        to: toEmail,
        subject,
        html,
        text,
      });
      console.log(`✉️ [EMAIL DELIVERED VIA GMAIL] to ${toEmail}`);
      return { sent: true, configured: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Gmail SMTP send error:', msg);
      return { sent: false, configured: true, error: msg };
    }
  }

  // 2. Custom SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465 || process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
      const fromAddress = process.env.SMTP_FROM || `"Pokémon Arena League" <${smtpUser}>`;
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html,
        text,
      });
      console.log(`✉️ [EMAIL DELIVERED VIA SMTP] to ${toEmail}`);
      return { sent: true, configured: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Custom SMTP send error:', msg);
      return { sent: false, configured: true, error: msg };
    }
  }

  // 3. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddress = process.env.SMTP_FROM || 'Pokémon Arena <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        console.log(`✉️ [EMAIL DELIVERED VIA RESEND] to ${toEmail}`);
        return { sent: true, configured: true };
      }
      const data = await res.text();
      console.error('Resend API error:', data);
      return { sent: false, configured: true, error: data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { sent: false, configured: true, error: msg };
    }
  }

  // 4. Brevo API
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    try {
      const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Pokémon Arena League', email: process.env.SMTP_FROM_EMAIL || 'noreply@pokemonarena.com' },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (res.ok) {
        console.log(`✉️ [EMAIL DELIVERED VIA BREVO] to ${toEmail}`);
        return { sent: true, configured: true };
      }
      const data = await res.text();
      console.error('Brevo API error:', data);
      return { sent: false, configured: true, error: data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { sent: false, configured: true, error: msg };
    }
  }

  return {
    sent: false,
    configured: false,
    error: 'Email delivery service is not configured on the server. Please add your SMTP credentials (such as GMAIL_USER & GMAIL_APP_PASSWORD or SMTP_HOST/USER/PASS) in environment variables to send OTPs to user emails.',
  };
}

// In-memory and local disk persistent storage
const inMemoryTrainers = new Map<string, Record<string, unknown>>();
const inMemoryOtps = new Map<string, { otp: string; expiresAt: number }>();
const inMemoryPhoneOtps = new Map<string, { otp: string; expiresAt: number; displayName?: string }>();
const inMemoryHighScores: Array<Record<string, unknown>> = [];

const DATA_DIR = path.join(process.cwd(), 'data');
const TRAINERS_FILE = path.join(DATA_DIR, 'trainers.json');
const HIGHSCORES_FILE = path.join(DATA_DIR, 'highscores.json');

function initLocalPersistence() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(TRAINERS_FILE)) {
      const raw = fs.readFileSync(TRAINERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const t of data) {
          if (t && typeof t === 'object') {
            if (t.email) inMemoryTrainers.set(String(t.email).toLowerCase(), t);
            if (t.username) inMemoryTrainers.set(String(t.username).toLowerCase(), t);
            if (t.id) inMemoryTrainers.set(String(t.id), t);
            if (t.phone) inMemoryTrainers.set(String(t.phone), t);
          }
        }
      }
    }
    if (fs.existsSync(HIGHSCORES_FILE)) {
      const raw = fs.readFileSync(HIGHSCORES_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        inMemoryHighScores.length = 0;
        inMemoryHighScores.push(...data);
      }
    }
  } catch {
    // fallback gracefully
  }
}

function persistTrainersToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const seen = new Set<string>();
    const uniqueTrainers: Record<string, unknown>[] = [];
    for (const t of inMemoryTrainers.values()) {
      const key = String(t.id || t.email || t.username);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTrainers.push(t);
      }
    }
    fs.writeFileSync(TRAINERS_FILE, JSON.stringify(uniqueTrainers, null, 2), 'utf-8');
  } catch {
    // fallback gracefully
  }
}

function persistHighScoresToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HIGHSCORES_FILE, JSON.stringify(inMemoryHighScores, null, 2), 'utf-8');
  } catch {
    // fallback gracefully
  }
}

function cleanPhoneNumber(raw: string): string {
  let cleaned = String(raw).trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    cleaned = '+91' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// Bot & fake accounts list to strictly exclude from leaderboards and rankings
const FAKE_BOT_USERNAMES = new Set([
  'trainer_blue', 'champion_cynthia', 'gym_leader_brock', 'trainer_red',
  'ash_ketchum', 'misty', 'steven_stone', 'champion_leon', 'dragon_master_lance',
  'cynthia', 'leon', 'steven', 'nemona', 'blue', 'lance', 'brock', 'ash', 'red'
]);
const FAKE_BOT_NAMES = new Set([
  'trainer blue', 'champion cynthia', 'gym leader brock', 'trainer red',
  'ash ketchum', 'misty', 'steven stone', 'leon', 'lance',
  'cynthia', 'nemona', 'blue', 'brock', 'ash', 'red'
]);
const FAKE_BOT_IDS = new Set([
  'acc_blue', 'acc_cynthia', 'acc_brock', 'acc_red', 'acc_ash',
  'acc_misty', 'acc_steven', 'acc_leon', 'acc_lance', '1', '2', '3', '4', '5', '6'
]);

function findTrainerInMemory(query: string): Record<string, unknown> | null {
  const clean = query.trim().replace(/^@/, '');
  const norm = clean.toLowerCase().replace(/[\s_-]/g, '');
  if (!norm) return null;
  if (inMemoryTrainers.has(clean)) return inMemoryTrainers.get(clean)!;
  if (inMemoryTrainers.has(clean.toLowerCase())) return inMemoryTrainers.get(clean.toLowerCase())!;
  if (inMemoryTrainers.has(norm)) return inMemoryTrainers.get(norm)!;

  for (const t of inMemoryTrainers.values()) {
    const tId = String(t.id || '');
    const tUname = String(t.username || '').toLowerCase();
    const tDname = String(t.displayName || '').toLowerCase();
    const normU = tUname.replace(/[\s_-]/g, '');
    const normD = tDname.replace(/[\s_-]/g, '');
    if (tId === clean || tUname === clean.toLowerCase() || tDname === clean.toLowerCase() || normU === norm || normD === norm) {
      return t;
    }
  }
  return null;
}

function getOrInitTrainer(
  userId: string,
  username: string,
  displayName?: string,
  avatarId?: number
): Record<string, unknown> {
  const cleanU = String(username || userId || 'trainer').trim().toLowerCase().replace(/^@/, '');
  const normU = cleanU.replace(/[\s_-]/g, '');
  const cleanD = String(displayName || username || 'Trainer').trim();

  let trainer: any =
    (userId ? inMemoryTrainers.get(userId) : null) ||
    findTrainerInMemory(userId) ||
    findTrainerInMemory(cleanU) ||
    (cleanD ? findTrainerInMemory(cleanD) : null);

  if (!trainer) {
    trainer = {
      id: userId || `acc_${normU}_${Date.now()}`,
      username: cleanU,
      displayName: cleanD,
      avatarId: Number(avatarId) || 25,
      level: 5,
      trophyPoints: 1000,
      createdAt: new Date().toISOString(),
    };
  }


  // Register across all indexing keys so lookups by ID, username, or displayName always resolve to this trainer
  if (trainer.id) inMemoryTrainers.set(String(trainer.id), trainer);
  if (cleanU) {
    inMemoryTrainers.set(cleanU, trainer);
    inMemoryTrainers.set(normU, trainer);
  }
  if (cleanD) {
    inMemoryTrainers.set(cleanD.toLowerCase(), trainer);
    inMemoryTrainers.set(cleanD.toLowerCase().replace(/[\s_-]/g, ''), trainer);
  }
  persistTrainersToDisk();

  return trainer;
}

// Email validation helper
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.includes('..')) return false;

  const atParts = trimmed.split('@');
  if (atParts.length !== 2) return false;
  const [localPart, domainPart] = atParts;
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.startsWith('-') || domainPart.endsWith('-')) return false;

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;
  for (const part of domainParts) {
    if (!part || !/^[a-zA-Z0-9-]+$/.test(part)) return false;
    if (part.startsWith('-') || part.endsWith('-')) return false;
  }
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

// ======================== API ROUTES ========================

// 1. Health & Status
app.get('/api/health', async (req, res) => {
  const database = await getDb();
  res.json({
    status: 'ok',
    mode: database && mongoConnected ? 'mongodb' : 'persistent_storage',
    mongodbConnected: !!database && mongoConnected,
    database: 'Pokemon_Arena',
  });
});

// 2. Send Signup OTP (FIRST TIME SIGNUP ONLY)
app.post('/api/auth/send-signup-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email. Please enter a valid email address.' });
    }

    const database = await getDb();

    // Check if email is already registered in MongoDB
    if (database) {
      const existingTrainer = await database.collection('trainers').findOne({ email: normalizedEmail });
      if (existingTrainer) {
        return res.status(400).json({
          error: 'This email is already registered. Please sign in with your password instead.',
          isExisting: true,
        });
      }
    } else {
      if (inMemoryTrainers.has(normalizedEmail)) {
        return res.status(400).json({
          error: 'This email is already registered. Please sign in with your password instead.',
          isExisting: true,
        });
      }
    }

    // Generate secure 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in-memory (no otps collection in database)
    inMemoryOtps.set(normalizedEmail, { otp, expiresAt });

    const mailResult = await sendOtpEmail(normalizedEmail, otp, 'signup');

    if (!mailResult.sent) {
      console.warn(`⚠️ [SIGNUP OTP NOT DELIVERED] to ${normalizedEmail}. Reason: ${mailResult.error}`);
      return res.status(mailResult.configured ? 500 : 503).json({
        error: mailResult.error || 'Failed to dispatch verification email. Please check server email settings.',
        emailSent: false,
        configured: mailResult.configured,
      });
    }

    console.log(`✉️ [SIGNUP OTP SENT] to ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox and spam folder.`,
      emailSent: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in send-signup-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to process signup verification code.' });
  }
});

// 3. Verify OTP & Complete First-Time Signup
app.post('/api/auth/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp, password, displayName } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP code, and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const database = await getDb();

    // Verify OTP using memory store (otps collection is completely removed from database)
    const memoryRecord = inMemoryOtps.get(normalizedEmail);
    const isValidOtp = !!(memoryRecord && memoryRecord.otp === cleanOtp && memoryRecord.expiresAt > Date.now());

    if (isValidOtp) {
      inMemoryOtps.delete(normalizedEmail);
    } else {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check or request a new OTP.' });
    }

    // Check once more if email was taken
    if (database) {
      const existing = await database.collection('trainers').findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: 'This email is already registered. Please log in.' });
      }
    }

    // Create Trainer Account document
    const cleanName = (displayName && String(displayName).trim()) || normalizedEmail.split('@')[0];
    const newAccount = {
      id: `trainer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: normalizedEmail,
      username: normalizedEmail.split('@')[0],
      displayName: cleanName,
      password: String(password),
      avatarId: 25, // Pikachu by default
      title: 'Rookie Trainer',
      level: 1,
      exp: 0,
      trophyPoints: 0,
      unlockedAvatars: [25, 1, 4, 7], // Starters + Pikachu
      unlockedSongIds: ['pallet_town'],
      activeSongId: 'pallet_town',
      totalGames: 0,
      totalWins: 0,
      totalCorrect: 0,
      totalGuesses: 0,
      bestStreak: 0,
      totalScore: 0,
      highScores: {},
      regionalMastery: {
        all: { correct: 0, total: 0 },
        kanto: { correct: 0, total: 0 },
        johto: { correct: 0, total: 0 },
        hoenn: { correct: 0, total: 0 },
        sinnoh: { correct: 0, total: 0 },
        unova: { correct: 0, total: 0 },
        kalos: { correct: 0, total: 0 },
        alola: { correct: 0, total: 0 },
        galar: { correct: 0, total: 0 },
        hisui: { correct: 0, total: 0 },
        paldea: { correct: 0, total: 0 },
      },
      achievements: {},
      trophies: {},
      createdAt: new Date().toISOString(),
    };

    if (database) {
      await database.collection('trainers').insertOne(newAccount);
      console.log(`✅ Saved new Trainer account: ${normalizedEmail} (${cleanName})`);
    }
    inMemoryTrainers.set(normalizedEmail, newAccount);
    if (newAccount.username) inMemoryTrainers.set(String(newAccount.username).toLowerCase(), newAccount);
    if (newAccount.id) inMemoryTrainers.set(String(newAccount.id), newAccount);
    persistTrainersToDisk();

    // Return account without exposing raw password in response
    const { password: _, ...safeAccount } = newAccount;

    return res.json({
      success: true,
      message: 'Account successfully registered in Pokémon Arena!',
      account: safeAccount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in verify-signup-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// 3.5 Direct Registration (Email + Password + Nickname, NO OTP)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const database = await getDb();

    // Check if user already exists
    if (database) {
      const existing = await database.collection('trainers').findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please log in instead.',
          isExisting: true,
        });
      }
    } else {
      if (inMemoryTrainers.has(normalizedEmail)) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please log in instead.',
          isExisting: true,
        });
      }
    }

    const cleanName = (displayName && String(displayName).trim()) || normalizedEmail.split('@')[0];
    const candidateUsername = (req.body.username && String(req.body.username).trim().toLowerCase()) || cleanName.toLowerCase().replace(/\s+/g, '_');

    // Ensure all usernames across the platform are strictly unique
    if (database) {
      const existingUser = await database.collection('trainers').findOne({
        username: { $regex: new RegExp(`^${candidateUsername}$`, 'i') }
      });
      if (existingUser) {
        return res.status(400).json({
          error: `Username "${candidateUsername}" is already taken. Every trainer must have a unique username!`,
        });
      }
    } else {
      for (const t of inMemoryTrainers.values()) {
        if (String(t.username || '').toLowerCase() === candidateUsername.toLowerCase()) {
          return res.status(400).json({
            error: `Username "${candidateUsername}" is already taken. Every trainer must have a unique username!`,
          });
        }
      }
    }

    const newAccount = {
      id: `trainer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: normalizedEmail,
      username: candidateUsername,
      displayName: cleanName,
      password: String(password),
      avatarId: 25, // Pikachu by default
      title: 'Rookie Trainer',
      level: 1,
      exp: 0,
      trophyPoints: 0,
      unlockedAvatars: [25, 1, 4, 7], // Starters + Pikachu
      unlockedSongIds: ['pallet_town'],
      activeSongId: 'pallet_town',
      totalGames: 0,
      totalWins: 0,
      totalCorrect: 0,
      totalGuesses: 0,
      bestStreak: 0,
      totalScore: 0,
      highScores: {},
      regionalMastery: {
        all: { correct: 0, total: 0 },
        kanto: { correct: 0, total: 0 },
        johto: { correct: 0, total: 0 },
        hoenn: { correct: 0, total: 0 },
        sinnoh: { correct: 0, total: 0 },
        unova: { correct: 0, total: 0 },
        kalos: { correct: 0, total: 0 },
        alola: { correct: 0, total: 0 },
        galar: { correct: 0, total: 0 },
        hisui: { correct: 0, total: 0 },
        paldea: { correct: 0, total: 0 },
      },
      achievements: {},
      trophies: {},
      createdAt: new Date().toISOString(),
    };

    if (database) {
      await database.collection('trainers').insertOne(newAccount);
      console.log(`✅ [DIRECT REGISTER] Saved new Trainer: ${normalizedEmail} (${cleanName})`);
    }
    inMemoryTrainers.set(normalizedEmail, newAccount);
    if (newAccount.username) inMemoryTrainers.set(String(newAccount.username).toLowerCase(), newAccount);
    if (newAccount.id) inMemoryTrainers.set(String(newAccount.id), newAccount);
    persistTrainersToDisk();

    const { password: _, ...safeAccount } = newAccount;

    return res.json({
      success: true,
      message: `Trainer Pass created for ${cleanName}! Welcome to Pokémon Arena.`,
      account: safeAccount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/auth/register:', errorMsg);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// 4. Login with Email OTP
// 4a. Send Login OTP to registered email
app.post('/api/auth/send-login-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const database = await getDb();
    let trainer = null;

    if (database) {
      trainer = await database.collection('trainers').findOne({ email: normalizedEmail });
    } else {
      trainer = inMemoryTrainers.get(normalizedEmail) || null;
    }

    if (!trainer) {
      return res.status(404).json({
        error: 'No trainer account found with this email. Please sign up first.',
        isRegistered: false,
      });
    }

    // Validate password if provided
    if (password && trainer.password && trainer.password !== String(password)) {
      return res.status(401).json({
        error: 'Incorrect password. Please verify and try again.',
      });
    }

    // Generate secure 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    inMemoryOtps.set(`${normalizedEmail}:login`, { otp, expiresAt });

    const mailResult = await sendOtpEmail(normalizedEmail, otp, 'login');

    if (!mailResult.sent) {
      console.warn(`⚠️ [LOGIN OTP NOT DELIVERED] to ${normalizedEmail}. Reason: ${mailResult.error}`);
      return res.status(mailResult.configured ? 500 : 503).json({
        error: mailResult.error || 'Failed to dispatch login verification email. Please check server email settings.',
        emailSent: false,
        configured: mailResult.configured,
      });
    }

    console.log(`✉️ [LOGIN OTP SENT] to ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `A 6-digit login verification code has been sent to ${normalizedEmail}. Please check your inbox.`,
      emailSent: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in send-login-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to send login verification code.' });
  }
});

// 4b. Verify Login OTP & Complete Login
app.post('/api/auth/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification OTP code are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const memoryRecord = inMemoryOtps.get(`${normalizedEmail}:login`);
    const isValidOtp = !!(memoryRecord && memoryRecord.otp === cleanOtp && memoryRecord.expiresAt > Date.now());

    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please request a new code.' });
    }

    inMemoryOtps.delete(`${normalizedEmail}:login`);

    const database = await getDb();
    let trainer = null;

    if (database) {
      trainer = await database.collection('trainers').findOne({ email: normalizedEmail });
    } else {
      trainer = inMemoryTrainers.get(normalizedEmail) || null;
    }

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer account not found.' });
    }

    const { password: _, ...safeAccount } = trainer;

    console.log(`🔓 Trainer logged in via Email OTP: ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `Welcome back, Trainer ${trainer.displayName}!`,
      account: safeAccount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in verify-login-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to verify login OTP.' });
  }
});

// 4c. Direct Login Fallback (optional direct credential route)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const database = await getDb();
    let trainer = null;

    if (database) {
      trainer = await database.collection('trainers').findOne({ email: normalizedEmail });
    } else {
      trainer = inMemoryTrainers.get(normalizedEmail) || null;
    }

    if (!trainer) {
      return res.status(404).json({
        error: 'No trainer account found with this email. Please sign up first.',
        isRegistered: false,
      });
    }

    // Validate password
    if (trainer.password !== String(password)) {
      return res.status(401).json({
        error: 'Incorrect password. Please verify and try again.',
      });
    }

    const { password: _, ...safeAccount } = trainer;

    console.log(`🔓 Trainer logged in: ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `Welcome back, Trainer ${trainer.displayName}!`,
      account: safeAccount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in login:', errorMsg);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// 4d. Send SMS OTP for Mobile Number Login & Signup
app.post('/api/auth/send-phone-otp', async (req, res) => {
  try {
    const { phone, displayName } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (10 to 15 digits).' });
    }

    // Generate secure 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    inMemoryPhoneOtps.set(cleanPhone, {
      otp,
      expiresAt,
      displayName: displayName ? String(displayName).trim() : undefined,
    });

    console.log(`📱 [SMS OTP DISPATCH] to ${cleanPhone}: ${otp}`);

    // If external SMS provider (e.g. Twilio, Fast2SMS, or custom gateway) is configured via env
    let smsSent = false;
    let smsProvider = '';

    // 1. Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const formParams = new URLSearchParams();
        formParams.append('To', cleanPhone);
        formParams.append('From', process.env.TWILIO_PHONE_NUMBER);
        formParams.append('Body', `[Pokémon Arena] Your verification OTP code is ${otp}. Valid for 10 minutes.`);

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formParams.toString(),
          }
        );
        if (twilioRes.ok) {
          smsSent = true;
          smsProvider = 'Twilio';
          console.log(`📱 Twilio SMS delivered to ${cleanPhone}`);
        } else {
          const twErr = await twilioRes.json().catch(() => ({}));
          console.error('Twilio SMS error:', twErr);
        }
      } catch (smsErr) {
        console.error('Twilio dispatch error:', smsErr);
      }
    }

    // 2. Fast2SMS (popular for international & Indian telecom)
    if (!smsSent && process.env.FAST2SMS_API_KEY) {
      try {
        const digits = cleanPhone.replace(/\D/g, '').slice(-10);
        const f2sRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: digits,
          }),
        });
        const f2sData = (await f2sRes.json().catch(() => ({}))) as { return?: boolean };
        if (f2sRes.ok && f2sData.return === true) {
          smsSent = true;
          smsProvider = 'Fast2SMS';
          console.log(`📱 Fast2SMS OTP delivered to ${cleanPhone}`);
        } else {
          console.error('Fast2SMS dispatch error:', f2sData);
        }
      } catch (fErr) {
        console.error('Fast2SMS fetch error:', fErr);
      }
    }

    // 3. Custom SMS Gateway Webhook
    if (!smsSent && process.env.SMS_GATEWAY_URL) {
      try {
        const gwRes = await fetch(process.env.SMS_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.SMS_GATEWAY_KEY ? { Authorization: `Bearer ${process.env.SMS_GATEWAY_KEY}` } : {}),
          },
          body: JSON.stringify({
            to: cleanPhone,
            otp,
            message: `[Pokémon Arena] Your verification OTP code is ${otp}. Valid for 10 minutes.`,
          }),
        });
        if (gwRes.ok) {
          smsSent = true;
          smsProvider = 'SMS Gateway';
          console.log(`📱 Custom SMS Gateway delivered to ${cleanPhone}`);
        }
      } catch (gwErr) {
        console.error('SMS Gateway error:', gwErr);
      }
    }

    // Mask phone number for security
    const maskedPhone = cleanPhone.length > 6
      ? `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)}`
      : cleanPhone;

    if (!smsSent) {
      return res.status(400).json({
        success: false,
        smsSent: false,
        error: 'No SMS carrier service (such as Twilio or Fast2SMS) is active on this server to deliver cellular SMS to your phone. Please use "Sign Up & Enter with Mobile" below to enter immediately with your mobile number, or sign in via Email (live Gmail OTP is active!).',
        canUseInstantPass: true,
      });
    }

    return res.json({
      success: true,
      smsSent: true,
      smsProvider,
      message: `A 6-digit SMS verification code has been delivered via ${smsProvider} to ${maskedPhone}. Please check your phone SMS.`,
      phone: cleanPhone,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in send-phone-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to send SMS verification code.' });
  }
});

// 4f. Instant Direct Mobile Login & Signup (Guarantees 100% login success regardless of carrier SMS status)
app.post('/api/auth/phone-direct', async (req, res) => {
  try {
    const { phone, displayName } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (8 to 15 digits).' });
    }

    const syntheticEmail = `${cleanPhone.replace('+', 'p')}@mobile.pokemonarena.com`;
    const database = await getDb();
    let existingTrainer = null;

    if (database) {
      existingTrainer = await database.collection('trainers').findOne({
        $or: [
          { phoneNumber: cleanPhone },
          { email: syntheticEmail },
        ],
      });
    } else {
      for (const t of inMemoryTrainers.values()) {
        const record = t as any;
        if (record && (record.phoneNumber === cleanPhone || record.email === syntheticEmail)) {
          existingTrainer = record;
          break;
        }
      }
    }

    if (existingTrainer) {
      const { password: _, ...safeAccount } = existingTrainer;
      console.log(`📱 Trainer logged in via Direct Mobile Pass: ${cleanPhone}`);
      return res.json({
        success: true,
        message: `Welcome back, Trainer ${existingTrainer.displayName}!`,
        account: safeAccount,
        isNewAccount: false,
      });
    }

    // Register a new Trainer Account linked to this Mobile Number
    const last4 = cleanPhone.slice(-4);
    const chosenName = (displayName && String(displayName).trim()) || `Trainer_${last4}`;
    const cleanUsername = `trainer_${cleanPhone.replace(/\D/g, '').slice(-8)}`;

    const newMobileAccount = {
      id: `trainer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      phoneNumber: cleanPhone,
      email: syntheticEmail,
      username: cleanUsername,
      pin: '1234',
      displayName: chosenName,
      avatarId: 25,
      trainerAvatarId: 'red',
      title: 'Rookie Pokémon Trainer',
      level: 1,
      exp: 0,
      trophyPoints: 0,
      unlockedAvatars: [25, 1, 4, 7],
      unlockedTrainerAvatars: ['red', 'pikachu'],
      unlockedSongIds: ['pallet_town'],
      activeSongId: 'pallet_town',
      totalGames: 0,
      totalWins: 0,
      totalCorrect: 0,
      totalGuesses: 0,
      bestStreak: 0,
      totalScore: 0,
      highScores: {},
      regionalMastery: {
        all: { correct: 0, total: 0 },
        kanto: { correct: 0, total: 0 },
        johto: { correct: 0, total: 0 },
        hoenn: { correct: 0, total: 0 },
        sinnoh: { correct: 0, total: 0 },
        unova: { correct: 0, total: 0 },
        kalos: { correct: 0, total: 0 },
        alola: { correct: 0, total: 0 },
        galar: { correct: 0, total: 0 },
        hisui: { correct: 0, total: 0 },
        paldea: { correct: 0, total: 0 },
      },
      achievements: {},
      trophies: {},
      dailyStreak: 1,
      lastLoginDateIST: new Date().toISOString().split('T')[0],
      claimedDailyStreakDays: [],
      battleTokens: 250,
      inventory: {},
      claimedFreeShopItems: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (database) {
      await database.collection('trainers').insertOne(newMobileAccount);
    }
    inMemoryTrainers.set(syntheticEmail, newMobileAccount);
    inMemoryTrainers.set(cleanPhone, newMobileAccount);
    if (newMobileAccount.id) inMemoryTrainers.set(String(newMobileAccount.id), newMobileAccount);
    persistTrainersToDisk();

    console.log(`📱 New Mobile Trainer registered via Direct Mobile Pass: ${cleanPhone} (${chosenName})`);

    return res.json({
      success: true,
      message: `Trainer Pass initialized! Welcome to Pokémon Arena, ${chosenName}!`,
      account: newMobileAccount,
      isNewAccount: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in phone-direct:', errorMsg);
    return res.status(500).json({ error: 'Failed to process mobile login.' });
  }
});

// 4e. Verify Mobile SMS OTP & Login / Signup
app.post('/api/auth/verify-phone-otp', async (req, res) => {
  try {
    const { phone, otp, displayName } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Mobile phone number and 6-digit SMS OTP are required.' });
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const cleanOtp = String(otp).trim();

    const memoryRecord = inMemoryPhoneOtps.get(cleanPhone);
    const isValidOtp = !!(memoryRecord && memoryRecord.otp === cleanOtp && memoryRecord.expiresAt > Date.now());

    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired SMS OTP code. Please request a new code.' });
    }

    inMemoryPhoneOtps.delete(cleanPhone);

    const syntheticEmail = `${cleanPhone.replace('+', 'p')}@mobile.pokemonarena.com`;
    const database = await getDb();
    let existingTrainer = null;

    if (database) {
      existingTrainer = await database.collection('trainers').findOne({
        $or: [
          { phoneNumber: cleanPhone },
          { email: syntheticEmail },
        ],
      });
    } else {
      for (const t of inMemoryTrainers.values()) {
        const record = t as any;
        if (record && (record.phoneNumber === cleanPhone || record.email === syntheticEmail)) {
          existingTrainer = record;
          break;
        }
      }
    }

    if (existingTrainer) {
      const { password: _, ...safeAccount } = existingTrainer;
      console.log(`📱 Trainer logged in via SMS OTP: ${cleanPhone}`);
      return res.json({
        success: true,
        message: `Welcome back, Trainer ${existingTrainer.displayName}!`,
        account: safeAccount,
        isNewAccount: false,
      });
    }

    // Register a new Trainer Account linked to this Mobile Number
    const last4 = cleanPhone.slice(-4);
    const chosenName = (displayName && String(displayName).trim()) ||
      (memoryRecord?.displayName && String(memoryRecord.displayName).trim()) ||
      `Trainer_${last4}`;
    const cleanUsername = `trainer_${cleanPhone.replace(/\D/g, '').slice(-8)}`;

    const newMobileAccount = {
      id: `trainer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      phoneNumber: cleanPhone,
      email: syntheticEmail,
      username: cleanUsername,
      pin: '1234',
      displayName: chosenName,
      avatarId: 25,
      trainerAvatarId: 'red',
      title: 'Rookie Pokémon Trainer',
      level: 1,
      exp: 0,
      trophyPoints: 0,
      unlockedAvatars: [25, 1, 4, 7],
      unlockedTrainerAvatars: ['red', 'pikachu'],
      unlockedSongIds: ['pallet_town'],
      activeSongId: 'pallet_town',
      totalGames: 0,
      totalWins: 0,
      totalCorrect: 0,
      totalGuesses: 0,
      bestStreak: 0,
      totalScore: 0,
      highScores: {},
      regionalMastery: {
        all: { correct: 0, total: 0 },
        kanto: { correct: 0, total: 0 },
        johto: { correct: 0, total: 0 },
        hoenn: { correct: 0, total: 0 },
        sinnoh: { correct: 0, total: 0 },
        unova: { correct: 0, total: 0 },
        kalos: { correct: 0, total: 0 },
        alola: { correct: 0, total: 0 },
        galar: { correct: 0, total: 0 },
        hisui: { correct: 0, total: 0 },
        paldea: { correct: 0, total: 0 },
      },
      achievements: {},
      trophies: {},
      dailyStreak: 1,
      lastLoginDateIST: new Date().toISOString().split('T')[0],
      claimedDailyStreakDays: [],
      battleTokens: 250,
      inventory: {},
      claimedFreeShopItems: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (database) {
      await database.collection('trainers').insertOne(newMobileAccount);
    }
    inMemoryTrainers.set(syntheticEmail, newMobileAccount);
    inMemoryTrainers.set(cleanPhone, newMobileAccount);
    if (newMobileAccount.id) inMemoryTrainers.set(String(newMobileAccount.id), newMobileAccount);
    persistTrainersToDisk();

    console.log(`📱 New Mobile Trainer registered: ${cleanPhone} (${chosenName})`);

    return res.json({
      success: true,
      message: `Trainer account successfully activated for ${cleanPhone}! Welcome to Pokémon Arena.`,
      account: newMobileAccount,
      isNewAccount: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in verify-phone-otp:', errorMsg);
    return res.status(500).json({ error: 'Failed to verify SMS verification code.' });
  }
});

// 5. Sync Account Progress to MongoDB
app.post('/api/account/sync', async (req, res) => {
  try {
    const { account } = req.body;
    if (!account || (!account.email && !account.phoneNumber && !account.id)) {
      return res.status(400).json({ error: 'Account data required.' });
    }

    const normalizedEmail = account.email ? String(account.email).trim().toLowerCase() : null;
    const cleanPhone = account.phoneNumber ? cleanPhoneNumber(account.phoneNumber) : null;
    const database = await getDb();

    const updateFields = {
      displayName: account.displayName,
      avatarId: account.avatarId,
      trainerAvatarId: account.trainerAvatarId,
      title: account.title,
      level: account.level,
      exp: account.exp,
      trophyPoints: account.trophyPoints,
      battleTokens: account.battleTokens,
      inventory: account.inventory,
      unlockedAvatars: account.unlockedAvatars,
      unlockedTrainerAvatars: account.unlockedTrainerAvatars,
      unlockedSongIds: account.unlockedSongIds,
      activeSongId: account.activeSongId,
      totalGames: account.totalGames,
      totalWins: account.totalWins,
      totalCorrect: account.totalCorrect,
      totalGuesses: account.totalGuesses,
      bestStreak: account.bestStreak,
      totalScore: account.totalScore,
      highScores: account.highScores,
      regionalMastery: account.regionalMastery,
      achievements: account.achievements,
      trophies: account.trophies,
      dailyStreak: account.dailyStreak,
      claimedFreeShopItems: account.claimedFreeShopItems,
      claimedDailyStreakDays: account.claimedDailyStreakDays,
      updatedAt: new Date().toISOString(),
    };

    if (database) {
      const matchQuery: Record<string, unknown> = {};
      if (normalizedEmail && cleanPhone) {
        matchQuery.$or = [{ email: normalizedEmail }, { phoneNumber: cleanPhone }, { id: account.id }];
      } else if (normalizedEmail) {
        matchQuery.$or = [{ email: normalizedEmail }, { id: account.id }];
      } else if (cleanPhone) {
        matchQuery.$or = [{ phoneNumber: cleanPhone }, { id: account.id }];
      } else {
        matchQuery.id = account.id;
      }

      await database.collection('trainers').updateOne(
        matchQuery,
        { $set: updateFields },
        { upsert: false }
      );
    }

    const key = normalizedEmail || cleanPhone || account.id;
    if (key) {
      const existing = inMemoryTrainers.get(key) || account;
      const merged = {
        ...existing,
        ...account,
        updatedAt: new Date().toISOString(),
      };
      inMemoryTrainers.set(key, merged);
      if (account.id) inMemoryTrainers.set(String(account.id), merged);
      if (normalizedEmail) inMemoryTrainers.set(normalizedEmail, merged);
      if (cleanPhone) inMemoryTrainers.set(cleanPhone, merged);
      persistTrainersToDisk();
    }

    return res.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error syncing account:', errorMsg);
    return res.status(500).json({ error: 'Failed to sync account.' });
  }
});

// 5.5 Lookup Trainer by Unique Username
app.get('/api/trainers/by-username/:username', async (req, res) => {
  try {
    const rawUsername = String(req.params.username || '').trim().toLowerCase();
    if (!rawUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const database = await getDb();
    if (database) {
      const trainer = await database.collection('trainers').findOne(
        {
          $or: [
            { username: { $regex: new RegExp(`^${rawUsername}$`, 'i') } },
            { displayName: { $regex: new RegExp(`^${rawUsername}$`, 'i') } },
          ],
        },
        { projection: { password: 0, email: 0 } }
      );
      if (trainer) {
        return res.json({ success: true, exists: true, trainer });
      }
    }

    const memoryTrainer = findTrainerInMemory(rawUsername);
    if (memoryTrainer) {
      const { password: _, email: __, ...safe } = memoryTrainer;
      return res.json({ success: true, exists: true, trainer: safe });
    }

    return res.status(404).json({ error: `Trainer with username "${rawUsername}" not found.`, exists: false });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
});

// 5.6 Universal Trainer Search (by User ID, username, or display name)
app.get('/api/trainers/lookup', async (req, res) => {
  try {
    const query = String(req.query.query || '').trim().replace(/^@/, '');
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const database = await getDb();
    if (database) {
      const trainer = await database.collection('trainers').findOne(
        {
          $or: [
            { id: query },
            { username: { $regex: new RegExp(`^${query}$`, 'i') } },
            { displayName: { $regex: new RegExp(`^${query}$`, 'i') } },
          ],
        },
        { projection: { password: 0, email: 0 } }
      );

      if (trainer) {
        return res.json({ success: true, exists: true, trainer });
      }
    }

    const memoryTrainer = findTrainerInMemory(query);
    if (memoryTrainer) {
      const { password: _, email: __, ...safe } = memoryTrainer;
      return res.json({ success: true, exists: true, trainer: safe });
    }

    return res.status(404).json({ error: `Trainer "${query}" not found.`, exists: false });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
});

// 6. Global Leaderboard from MongoDB (Top 100 real trainers by highest ranks and trophies)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const queryUserId = req.query.userId ? String(req.query.userId).trim() : null;
    const queryEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const queryUsername = req.query.username ? String(req.query.username).trim().toLowerCase() : null;

    const database = await getDb();
    if (database) {
      const realFilter: Record<string, unknown> = {
        id: { $nin: Array.from(FAKE_BOT_IDS) },
        username: { $nin: Array.from(FAKE_BOT_USERNAMES) },
        isBot: { $ne: true },
        isSeed: { $ne: true },
      };

      const trainers = await database
        .collection('trainers')
        .find(
          realFilter,
          { projection: { password: 0 } }
        )
        .sort({ trophyPoints: -1, totalScore: -1, level: -1, totalWins: -1 })
        .limit(100)
        .toArray();

      // Ensure no bot records slip through
      const filteredTrainers = trainers.filter((t: any) => {
        if (!t) return false;
        const tid = String(t.id || '');
        const u = String(t.username || '').toLowerCase().trim();
        const d = String(t.displayName || '').toLowerCase().trim();
        if (FAKE_BOT_IDS.has(tid)) return false;
        if (FAKE_BOT_USERNAMES.has(u) || FAKE_BOT_NAMES.has(d)) return false;
        return true;
      });

      let userRank = null;
      if (queryUserId || queryEmail || queryUsername) {
        const userDoc = await database.collection('trainers').findOne({
          $or: [
            ...(queryUserId ? [{ id: queryUserId }] : []),
            ...(queryEmail ? [{ email: queryEmail }] : []),
            ...(queryUsername ? [{ username: queryUsername }] : []),
          ],
        });

        if (userDoc) {
          const userTP = userDoc.trophyPoints || 0;
          const userScore = userDoc.totalScore || 0;
          const userLevel = userDoc.level || 1;
          const userExp = userDoc.exp || 0;

          const [trophyRankCount, levelRankCount, scoreRankCount, totalCount] = await Promise.all([
            database.collection('trainers').countDocuments({
              ...realFilter,
              $or: [
                { trophyPoints: { $gt: userTP } },
                { trophyPoints: userTP, totalScore: { $gt: userScore } },
              ],
            }),
            database.collection('trainers').countDocuments({
              ...realFilter,
              $or: [
                { level: { $gt: userLevel } },
                { level: userLevel, exp: { $gt: userExp } },
              ],
            }),
            database.collection('trainers').countDocuments({
              ...realFilter,
              totalScore: { $gt: userScore },
            }),
            database.collection('trainers').countDocuments(realFilter),
          ]);

          userRank = {
            trophyRank: trophyRankCount + 1,
            levelRank: levelRankCount + 1,
            scoreRank: scoreRankCount + 1,
            totalTrainers: Math.max(totalCount, 1),
            trainer: {
              id: userDoc.id,
              displayName: userDoc.displayName,
              username: userDoc.username,
              level: userDoc.level || 1,
              exp: userDoc.exp || 0,
              trophyPoints: userDoc.trophyPoints || 0,
              totalScore: userDoc.totalScore || 0,
              avatarId: userDoc.avatarId || 25,
              title: userDoc.title || 'Pokémon Trainer',
            },
          };
        }
      }

      return res.json({ success: true, trainers: filteredTrainers, userRank });
    }

    // In-memory fallback: Deduplicate real trainers and strictly exclude fake/bot accounts
    const uniqueTrainersMap = new Map<string, any>();
    for (const t of inMemoryTrainers.values()) {
      if (!t) continue;
      const tid = String(t.id || '');
      const u = String(t.username || '').toLowerCase().trim();
      const d = String(t.displayName || '').toLowerCase().trim();
      if (FAKE_BOT_IDS.has(tid)) continue;
      if (FAKE_BOT_USERNAMES.has(u) || FAKE_BOT_NAMES.has(d)) continue;
      if (t.isBot || t.isSeed) continue;

      const key = String(t.email || t.id || t.username);
      if (!uniqueTrainersMap.has(key)) {
        const { password: _, ...safe } = t;
        uniqueTrainersMap.set(key, safe);
      }
    }

    const memoryTrainers = Array.from(uniqueTrainersMap.values())
      .sort((a: any, b: any) => {
        if ((b.trophyPoints || 0) !== (a.trophyPoints || 0)) {
          return (b.trophyPoints || 0) - (a.trophyPoints || 0);
        }
        if ((b.totalScore || 0) !== (a.totalScore || 0)) {
          return (b.totalScore || 0) - (a.totalScore || 0);
        }
        return (b.level || 1) - (a.level || 1);
      });

    let userRank = null;
    if (queryUserId || queryEmail || queryUsername) {
      const uIndex = memoryTrainers.findIndex((t: any) =>
        (queryUserId && t.id === queryUserId) ||
        (queryEmail && t.email?.toLowerCase() === queryEmail) ||
        (queryUsername && t.username?.toLowerCase() === queryUsername)
      );

      const byLevel = [...memoryTrainers].sort((a: any, b: any) => (b.level || 1) - (a.level || 1) || (b.exp || 0) - (a.exp || 0));
      const lvlIndex = byLevel.findIndex((t: any) =>
        (queryUserId && t.id === queryUserId) ||
        (queryEmail && t.email?.toLowerCase() === queryEmail) ||
        (queryUsername && t.username?.toLowerCase() === queryUsername)
      );

      if (uIndex !== -1) {
        const uDoc = memoryTrainers[uIndex];
        userRank = {
          trophyRank: uIndex + 1,
          levelRank: lvlIndex !== -1 ? lvlIndex + 1 : uIndex + 1,
          scoreRank: uIndex + 1,
          totalTrainers: Math.max(memoryTrainers.length, 1),
          trainer: uDoc,
        };
      }
    }

    return res.json({ success: true, trainers: memoryTrainers.slice(0, 100), userRank });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});

// 7. High Scores (POST & GET real player scores)
app.post('/api/highscores', async (req, res) => {
  try {
    const { playerName, score, accuracy, streak, mode, region, email } = req.body;
    if (!playerName || typeof score !== 'number') {
      return res.status(400).json({ error: 'playerName and numeric score required.' });
    }

    const cleanName = String(playerName).trim();
    const cleanLower = cleanName.toLowerCase();
    // Block any bot seed names
    if (FAKE_BOT_NAMES.has(cleanLower) || FAKE_BOT_USERNAMES.has(cleanLower)) {
      return res.status(400).json({ error: 'Bot names cannot be registered.' });
    }

    const newRecord = {
      id: `hs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      playerName: cleanName,
      email: email ? String(email).trim().toLowerCase() : undefined,
      score: Number(score),
      accuracy: Number(accuracy) || 0,
      streak: Number(streak) || 0,
      mode: mode || 'classic',
      region: region || 'all',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const database = await getDb();
    if (database) {
      await database.collection('high_scores').insertOne(newRecord);
    }
    inMemoryHighScores.push(newRecord);
    persistHighScoresToDisk();

    return res.json({ success: true, record: newRecord });
  } catch (err: unknown) {
    console.error('Error posting high score:', err);
    return res.status(500).json({ error: 'Failed to save high score.' });
  }
});

app.get('/api/highscores', async (req, res) => {
  try {
    const database = await getDb();
    let records: any[] = [];

    if (database) {
      records = await database
        .collection('high_scores')
        .find({
          id: { $nin: Array.from(FAKE_BOT_IDS) },
        })
        .sort({ score: -1 })
        .limit(100)
        .toArray();

      // Also integrate scores from active registered trainers who have actually played
      const activeTrainers = await database
        .collection('trainers')
        .find(
          {
            id: { $nin: Array.from(FAKE_BOT_IDS) },
            username: { $nin: Array.from(FAKE_BOT_USERNAMES) },
            isBot: { $ne: true },
            $or: [
              { totalScore: { $gt: 0 } },
              { totalGames: { $gt: 0 } },
              { trophyPoints: { $gt: 0 } },
            ],
          },
          { projection: { password: 0 } }
        )
        .toArray();

      for (const t of activeTrainers) {
        const tId = String(t.id || '');
        const tU = String(t.username || '').toLowerCase().trim();
        const tD = String(t.displayName || '').toLowerCase().trim();
        if (FAKE_BOT_IDS.has(tId) || FAKE_BOT_USERNAMES.has(tU) || FAKE_BOT_NAMES.has(tD)) {
          continue;
        }

        if (t.highScores && typeof t.highScores === 'object') {
          for (const [modeKey, val] of Object.entries(t.highScores)) {
            const numericVal = Number(val);
            if (numericVal > 0) {
              const alreadyHas = records.some(
                (r) =>
                  (r.email && r.email === t.email && r.mode === modeKey && r.score >= numericVal) ||
                  (r.playerName === t.displayName && r.mode === modeKey && r.score >= numericVal)
              );
              if (!alreadyHas) {
                records.push({
                  id: `derived_${t._id || t.id}_${modeKey}`,
                  playerName: t.displayName || t.username || 'Trainer',
                  email: t.email,
                  score: numericVal,
                  accuracy: t.totalGuesses > 0 ? Math.round((t.totalCorrect / t.totalGuesses) * 100) : 100,
                  streak: t.bestStreak || 0,
                  mode: modeKey,
                  region: 'all',
                  date: (t.updatedAt || t.createdAt || new Date().toISOString()).split('T')[0],
                });
              }
            }
          }
        } else if (t.totalScore > 0) {
          const alreadyHas = records.some(
            (r) => (r.email && r.email === t.email) || r.playerName === t.displayName
          );
          if (!alreadyHas) {
            records.push({
              id: `derived_${t._id || t.id}_total`,
              playerName: t.displayName || t.username || 'Trainer',
              email: t.email,
              score: t.totalScore,
              accuracy: t.totalGuesses > 0 ? Math.round((t.totalCorrect / t.totalGuesses) * 100) : 100,
              streak: t.bestStreak || 0,
              mode: 'classic',
              region: 'all',
              date: (t.updatedAt || t.createdAt || new Date().toISOString()).split('T')[0],
            });
          }
        }
      }
    } else {
      records = [...inMemoryHighScores];
    }

    // Filter out bots and sort descending
    const cleanRecords = records
      .filter((r) => {
        if (!r) return false;
        const rId = String(r.id || '');
        const rName = String(r.playerName || '').toLowerCase().trim();
        if (FAKE_BOT_IDS.has(rId)) return false;
        if (FAKE_BOT_NAMES.has(rName) || FAKE_BOT_USERNAMES.has(rName) || !rName) return false;
        return Number(r.score) > 0;
      })
      .sort((a, b) => Number(b.score) - Number(a.score));

    return res.json({ success: true, scores: cleanRecords.slice(0, 100) });
  } catch (err: unknown) {
    console.error('Error fetching high scores:', err);
    return res.status(500).json({ error: 'Failed to fetch high scores.' });
  }
});

// =========================================================================
// REAL-TIME 1v1 MULTIPLAYER PVP & MATCHMAKING SYSTEM
// =========================================================================

interface DuelPlayer {
  id: string;
  name: string;
  avatarId: number;
  score: number;
  baseScore: number;
  speedScore: number;
  answers: boolean[];
  times: number[];
}

interface DuelQuestion {
  targetId: number;
  targetName: string;
  displayName: string;
  types: string[];
  species: string;
  height: number;
  weight: number;
  moves: string[];
  artwork: string;
  options: Array<{ id: number; displayName: string; types: string[] }>;
  correctOptionId: number;
  shadowCrop?: 'full' | 'upper' | 'lower' | 'head' | 'tail' | 'arm' | 'leg';
}

interface DuelRoomState {
  code: string;
  host: DuelPlayer;
  guest: DuelPlayer | null;
  rounds: number;
  timeLimit: number;
  difficulty: string;
  region: string;
  status: 'waiting' | 'in_progress' | 'round_reveal' | 'finished';
  questions: DuelQuestion[];
  currentRoundIdx: number;
  roundStartTime: number;
  firstAnswerer: { playerId: string; playerName: string; timeTaken: number } | null;
  roundAnswers: Record<string, {
    playerId: string;
    playerName: string;
    choiceId: number;
    isCorrect: boolean;
    timeTaken: number;
    timeRemaining: number;
    pointsEarned: number;
    speedTier: string;
    isFirst: boolean;
  }>;
  lastRoundBreakdown: {
    firstAnswerer: { playerId: string; playerName: string; timeTaken: number } | null;
    roundIdx: number;
    correctPokemon: { id: number; displayName: string; artwork: string; types: string[] };
    answers: Record<string, {
      playerName: string;
      isCorrect: boolean;
      timeTaken: number;
      pointsEarned: number;
      isFirst: boolean;
    }>;
  } | null;
  createdAt: number;
  lastActivity: number;
}

const activeDuelRooms = new Map<string, DuelRoomState>();
const matchmakingQueue: Array<{
  playerId: string;
  playerName: string;
  avatarId: number;
  difficulty: string;
  region: string;
  roomCode: string;
  queuedAt: number;
}> = [];

// Helper to get all Pokémon for question generation
let cachedPokemonList: any[] | null = null;
function getAllPokemonData(): any[] {
  if (cachedPokemonList) return cachedPokemonList;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/allPokemon.json'), 'utf8');
    cachedPokemonList = JSON.parse(raw);
    return cachedPokemonList || [];
  } catch (err) {
    console.error('Failed to read allPokemon.json on server:', err);
    return [];
  }
}

function generateQuestionsForRoom(rounds: number, region: string, difficulty: string = 'easy'): DuelQuestion[] {
  const allPoke = getAllPokemonData();
  let pool = allPoke;
  if (region && region !== 'all') {
    pool = allPoke.filter((p) => p.region === region);
  }
  if (!pool || pool.length < 4) pool = allPoke;

  const questions: DuelQuestion[] = [];
  const usedIds = new Set<number>();

  for (let r = 0; r < rounds; r++) {
    const available = pool.filter((p) => !usedIds.has(p.id));
    const target = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];

    usedIds.add(target.id);

    // Pick 3 decoys
    const decoys: any[] = [];
    const decoyPool = pool.filter((p) => p.id !== target.id);
    const shuffledDecoys = [...decoyPool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(3, shuffledDecoys.length); i++) {
      decoys.push(shuffledDecoys[i]);
    }

    const allOptions = [target, ...decoys].sort(() => 0.5 - Math.random()).map((opt) => ({
      id: opt.id,
      displayName: opt.displayName,
      types: opt.types || ['normal'],
    }));

    let shadowCrop: 'full' | 'upper' | 'lower' | 'head' | 'tail' | 'arm' | 'leg' = 'full';
    if (difficulty === 'medium') {
      shadowCrop = Math.random() < 0.5 ? 'upper' : 'lower';
    } else if (difficulty === 'hard') {
      const parts: ('head' | 'tail' | 'arm' | 'leg')[] = ['head', 'tail', 'arm', 'leg'];
      shadowCrop = parts[Math.floor(Math.random() * parts.length)];
    }

    questions.push({
      targetId: target.id,
      targetName: target.name,
      displayName: target.displayName,
      types: target.types || ['normal'],
      species: target.species || 'Pokémon',
      height: target.height || 10,
      weight: target.weight || 100,
      moves: target.moves || ['Tackle', 'Quick Attack'],
      artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${target.id}.png`,
      options: allOptions,
      correctOptionId: target.id,
      shadowCrop,
    });
  }

  return questions;
}

// 1. Create Room (Private / Host)
app.post('/api/duel/create', (req, res) => {
  try {
    const { playerName, avatarId, rounds = 5, timeLimit = 15, difficulty = 'easy', region = 'all' } = req.body;
    const playerId = `p1_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const roomCode = `PKMN-${Math.floor(1000 + Math.random() * 9000)}`;

    const questions = generateQuestionsForRoom(Number(rounds) || 5, region, String(difficulty));
    const activeTimeLimit =
      difficulty === 'menacing'
        ? 60
        : difficulty === 'extreme'
        ? 30
        : difficulty === 'hard'
        ? 8
        : difficulty === 'medium'
        ? 12
        : Number(timeLimit) || 15;

    const room: DuelRoomState = {
      code: roomCode,
      host: {
        id: playerId,
        name: playerName || 'Trainer 1',
        avatarId: Number(avatarId) || 25,
        score: 0,
        baseScore: 0,
        speedScore: 0,
        answers: [],
        times: [],
      },
      guest: null,
      rounds: Number(rounds) || 5,
      timeLimit: activeTimeLimit,
      difficulty: difficulty || 'easy',
      region: region || 'all',
      status: 'waiting',
      questions,
      currentRoundIdx: 0,
      roundStartTime: 0,
      firstAnswerer: null,
      roundAnswers: {},
      lastRoundBreakdown: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    activeDuelRooms.set(roomCode, room);

    return res.json({
      success: true,
      roomCode,
      playerId,
      room,
    });
  } catch (err) {
    console.error('Error creating duel room:', err);
    return res.status(500).json({ error: 'Failed to create room.' });
  }
});

// 2. Join Room (via Room Code or QR Code URL)
app.post('/api/duel/join', (req, res) => {
  try {
    const { roomCode, playerName, avatarId } = req.body;
    if (!roomCode) return res.status(400).json({ error: 'Room code is required.' });

    const normalizedCode = String(roomCode).trim().toUpperCase();
    const room = activeDuelRooms.get(normalizedCode);

    if (!room) {
      return res.status(404).json({ error: `Room ${normalizedCode} not found or expired.` });
    }

    if (room.guest && room.status !== 'waiting') {
      return res.status(400).json({ error: 'This duel room is already full and active!' });
    }

    const playerId = `p2_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    room.guest = {
      id: playerId,
      name: playerName || 'Challenger',
      avatarId: Number(avatarId) || 6,
      score: 0,
      baseScore: 0,
      speedScore: 0,
      answers: [],
      times: [],
    };

    room.status = 'in_progress';
    room.currentRoundIdx = 0;
    room.roundStartTime = Date.now();
    room.roundAnswers = {};
    room.firstAnswerer = null;
    room.lastActivity = Date.now();

    return res.json({
      success: true,
      roomCode: room.code,
      playerId,
      room,
    });
  } catch (err) {
    console.error('Error joining duel room:', err);
    return res.status(500).json({ error: 'Failed to join room.' });
  }
});

// 3. Matchmaking: Random Play with online trainers
app.post('/api/duel/random-match', (req, res) => {
  try {
    const { playerName, avatarId, difficulty = 'easy', region = 'all' } = req.body;
    const now = Date.now();
    const playerId = `rand_${now}_${Math.random().toString(36).slice(2, 6)}`;

    // Clean up expired queue items (>40s)
    const validQueue = matchmakingQueue.filter((q) => now - q.queuedAt < 40000);
    matchmakingQueue.length = 0;
    matchmakingQueue.push(...validQueue);

    // Look for a waiting player
    const waitingOpponentIndex = matchmakingQueue.findIndex((q) => q.playerId !== playerId);

    if (waitingOpponentIndex !== -1) {
      const waitingOpponent = matchmakingQueue.splice(waitingOpponentIndex, 1)[0];
      const room = activeDuelRooms.get(waitingOpponent.roomCode);

      if (room && !room.guest) {
        room.guest = {
          id: playerId,
          name: playerName || 'Rival Trainer',
          avatarId: Number(avatarId) || 150,
          score: 0,
          baseScore: 0,
          speedScore: 0,
          answers: [],
          times: [],
        };
        room.status = 'in_progress';
        room.currentRoundIdx = 0;
        room.roundStartTime = Date.now();
        room.roundAnswers = {};
        room.firstAnswerer = null;
        room.lastActivity = Date.now();

        return res.json({
          success: true,
          matched: true,
          roomCode: room.code,
          playerId,
          room,
        });
      }
    }

    // No waiting player found: create new room and wait in queue
    const roomCode = `RAND-${Math.floor(1000 + Math.random() * 9000)}`;
    const questions = generateQuestionsForRoom(5, region, String(difficulty));

    const room: DuelRoomState = {
      code: roomCode,
      host: {
        id: playerId,
        name: playerName || 'Trainer',
        avatarId: Number(avatarId) || 25,
        score: 0,
        baseScore: 0,
        speedScore: 0,
        answers: [],
        times: [],
      },
      guest: null,
      rounds: 5,
      timeLimit:
        difficulty === 'menacing'
          ? 60
          : difficulty === 'extreme'
          ? 30
          : difficulty === 'hard'
          ? 8
          : difficulty === 'medium'
          ? 12
          : 15,
      difficulty,
      region,
      status: 'waiting',
      questions,
      currentRoundIdx: 0,
      roundStartTime: 0,
      firstAnswerer: null,
      roundAnswers: {},
      lastRoundBreakdown: null,
      createdAt: now,
      lastActivity: now,
    };

    activeDuelRooms.set(roomCode, room);
    matchmakingQueue.push({
      playerId,
      playerName: playerName || 'Trainer',
      avatarId: Number(avatarId) || 25,
      difficulty,
      region,
      roomCode,
      queuedAt: now,
    });

    return res.json({
      success: true,
      matched: false,
      waiting: true,
      roomCode,
      playerId,
      room,
    });
  } catch (err) {
    console.error('Error in random matchmaking:', err);
    return res.status(500).json({ error: 'Matchmaking failed.' });
  }
});

// 4. Poll Room State (Real-time synchronization for both devices)
app.get('/api/duel/room/:code', (req, res) => {
  try {
    const normalizedCode = String(req.params.code).trim().toUpperCase();
    const room = activeDuelRooms.get(normalizedCode);
    if (!room) {
      return res.status(404).json({ error: 'Duel room not found.' });
    }

    room.lastActivity = Date.now();

    // Auto-advance if round_reveal has elapsed 3.5 seconds
    if (room.status === 'round_reveal') {
      const revealDuration = Date.now() - (room.roundStartTime || 0);
      if (revealDuration > 3500) {
        if (room.currentRoundIdx + 1 >= room.rounds) {
          room.status = 'finished';
        } else {
          room.currentRoundIdx += 1;
          room.status = 'in_progress';
          room.roundStartTime = Date.now();
          room.roundAnswers = {};
          room.firstAnswerer = null;
        }
      }
    }

    // Auto-timeout if round in progress exceeds timeLimit + 3 seconds grace period
    if (room.status === 'in_progress' && room.roundStartTime > 0) {
      const elapsedSec = (Date.now() - room.roundStartTime) / 1000;
      if (elapsedSec > room.timeLimit + 2) {
        // Force reveal if time ran out
        const curQ = room.questions[room.currentRoundIdx];
        room.status = 'round_reveal';
        room.roundStartTime = Date.now();
        room.lastRoundBreakdown = {
          firstAnswerer: room.firstAnswerer,
          roundIdx: room.currentRoundIdx,
          correctPokemon: {
            id: curQ.targetId,
            displayName: curQ.displayName,
            artwork: curQ.artwork,
            types: curQ.types,
          },
          answers: { ...room.roundAnswers },
        };
      }
    }

    return res.json({
      success: true,
      room,
    });
  } catch (err) {
    console.error('Error getting duel room:', err);
    return res.status(500).json({ error: 'Failed to retrieve room.' });
  }
});

// 5. Submit Answer for Current Round
app.post('/api/duel/room/:code/answer', (req, res) => {
  try {
    const normalizedCode = String(req.params.code).trim().toUpperCase();
    const room = activeDuelRooms.get(normalizedCode);
    if (!room) {
      return res.status(404).json({ error: 'Duel room not found.' });
    }

    const { playerId, playerName, choiceId, timeRemaining, timeTaken } = req.body;
    if (room.status !== 'in_progress') {
      return res.json({ success: false, message: 'Round is not in progress.', room });
    }

    const curQ = room.questions[room.currentRoundIdx];
    if (!curQ) {
      return res.status(400).json({ error: 'Invalid round index.' });
    }

    // Check if player already answered this round
    if (room.roundAnswers[playerId]) {
      return res.json({ success: true, alreadyAnswered: true, room });
    }

    const isCorrect = Number(choiceId) === curQ.correctOptionId;
    const isFirst = !room.firstAnswerer;

    if (isFirst) {
      room.firstAnswerer = {
        playerId,
        playerName: playerName || 'Trainer',
        timeTaken: Math.max(0.1, Number(timeTaken) || 0.1),
      };
    }

    // Points calculation
    const basePoints = isCorrect ? (room.difficulty === 'hard' ? 250 : room.difficulty === 'medium' ? 180 : 120) : 0;
    const speedBonus = isCorrect ? Math.round(Math.max(0, Number(timeRemaining) || 0) * (room.difficulty === 'hard' ? 25 : 18)) : 0;
    const firstBonus = isCorrect && isFirst ? 150 : 0; // Quick Reflex bonus for answering first!
    const totalPoints = basePoints + speedBonus + firstBonus;

    let speedTier = 'none';
    if (timeTaken <= 2.0) speedTier = 'instant';
    else if (timeTaken <= 4.0) speedTier = 'fast';
    else if (timeTaken <= 8.0) speedTier = 'moderate';
    else speedTier = 'slow';

    room.roundAnswers[playerId] = {
      playerId,
      playerName: playerName || 'Trainer',
      choiceId: Number(choiceId),
      isCorrect,
      timeTaken: Number(timeTaken) || 0,
      timeRemaining: Number(timeRemaining) || 0,
      pointsEarned: totalPoints,
      speedTier,
      isFirst,
    };

    // Update player's aggregate score
    if (room.host.id === playerId) {
      room.host.score += totalPoints;
      room.host.baseScore += basePoints;
      room.host.speedScore += (speedBonus + firstBonus);
      room.host.answers.push(isCorrect);
      room.host.times.push(Number(timeTaken) || 0);
    } else if (room.guest && room.guest.id === playerId) {
      room.guest.score += totalPoints;
      room.guest.baseScore += basePoints;
      room.guest.speedScore += (speedBonus + firstBonus);
      room.guest.answers.push(isCorrect);
      room.guest.times.push(Number(timeTaken) || 0);
    }

    // Check if both players have answered
    const bothAnswered = room.guest && !!room.roundAnswers[room.host.id] && !!room.roundAnswers[room.guest.id];

    if (bothAnswered) {
      room.status = 'round_reveal';
      room.roundStartTime = Date.now(); // used for reveal duration timer
      room.lastRoundBreakdown = {
        firstAnswerer: room.firstAnswerer,
        roundIdx: room.currentRoundIdx,
        correctPokemon: {
          id: curQ.targetId,
          displayName: curQ.displayName,
          artwork: curQ.artwork,
          types: curQ.types,
        },
        answers: { ...room.roundAnswers },
      };
    }

    room.lastActivity = Date.now();
    return res.json({
      success: true,
      isCorrect,
      isFirst,
      pointsEarned: totalPoints,
      bothAnswered,
      room,
    });
  } catch (err) {
    console.error('Error submitting duel answer:', err);
    return res.status(500).json({ error: 'Failed to record answer.' });
  }
});

// 6. Manual next round trigger (or forced advance)
app.post('/api/duel/room/:code/next', (req, res) => {
  try {
    const normalizedCode = String(req.params.code).trim().toUpperCase();
    const room = activeDuelRooms.get(normalizedCode);
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    if (room.currentRoundIdx + 1 >= room.rounds) {
      room.status = 'finished';
    } else {
      room.currentRoundIdx += 1;
      room.status = 'in_progress';
      room.roundStartTime = Date.now();
      room.roundAnswers = {};
      room.firstAnswerer = null;
    }

    return res.json({ success: true, room });
  } catch (err) {
    console.error('Error advancing duel round:', err);
    return res.status(500).json({ error: 'Failed to advance.' });
  }
});

// 7. Leave / Cancel Room
app.post('/api/duel/room/:code/leave', (req, res) => {
  try {
    const normalizedCode = String(req.params.code).trim().toUpperCase();
    const room = activeDuelRooms.get(normalizedCode);
    if (room) {
      room.status = 'finished';
      room.lastActivity = Date.now();
      // Keep room available briefly so opponent's client sees conclusion cleanly
      setTimeout(() => {
        activeDuelRooms.delete(normalizedCode);
      }, 20000);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to leave.' });
  }
});

// Periodic cleanup of stale duel rooms (> 15 min inactive)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of activeDuelRooms.entries()) {
    if (now - (room.lastActivity || room.createdAt) > 15 * 60 * 1000) {
      activeDuelRooms.delete(code);
    }
  }
}, 5 * 60 * 1000);


// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize local persistent storage
  initLocalPersistence();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pokémon Arena server running on http://0.0.0.0:${PORT}`);
    // Pre-connect to MongoDB if configured
    getDb();
  });
}

startServer();
