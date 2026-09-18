import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Default MongoDB URI fallback provided by user
const DEFAULT_MONGO_URI = 'mongodb+srv://samantasatyajit503:BvkGJFoH8dRgoBcr@cluster0.0hr5n8b.mongodb.net/Pokemon_Arena?retryWrites=true&w=majority';

// Robust sanitizer for MongoDB connection string (handles pasted MONGODB_URI= prefixes, quotes, and whitespace)
function sanitizeMongoUri(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_MONGO_URI;
  let clean = raw.trim();
  // Strip variable name prefix if user passed "MONGODB_URI=mongodb+srv://..."
  clean = clean.replace(/^(?:MONGODB_URI|DATABASE_URL)=\s*/i, '').trim();
  // Strip surrounding quotes
  clean = clean.replace(/^["'`]|["'`]$/g, '').trim();
  // Extract mongodb URL pattern if embedded
  const match = clean.match(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/i);
  if (match && match[0]) {
    return match[0];
  }
  return clean.startsWith('mongodb://') || clean.startsWith('mongodb+srv://') ? clean : DEFAULT_MONGO_URI;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let mongoConnected = false;
let mongoConnectionError: string | null = null;

// Connect to MongoDB Atlas
async function getDb(): Promise<Db | null> {
  if (db && mongoConnected) return db;
  try {
    const activeUri = sanitizeMongoUri(process.env.MONGODB_URI);
    if (!mongoClient) {
      mongoClient = new MongoClient(activeUri, {
        connectTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000,
      });
    }
    await mongoClient.connect();
    db = mongoClient.db('Pokemon_Arena');
    mongoConnected = true;
    mongoConnectionError = null;
    console.log('✅ Connected to MongoDB Atlas Database: Pokemon_Arena');

    // Ensure otps collection is completely removed from the database
    try {
      await db.collection('otps').drop();
      console.log('🗑️ Removed otps collection from database');
    } catch {
      // collection may already not exist or is dropped
    }

    // Create unique index on email
    try {
      await db.collection('trainers').createIndex({ email: 1 }, { unique: true });
    } catch {
      // index might already exist
    }

    return db;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('⚠️ MongoDB connection error:', errorMsg);
    mongoConnected = false;
    mongoConnectionError = errorMsg;
    mongoClient = null;
    db = null;
    return null;
  }
}

// Nodemailer transporter helper
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

// In-memory fallback stores if MongoDB Atlas is momentarily unavailable
const inMemoryTrainers = new Map<string, Record<string, unknown>>();
const inMemoryOtps = new Map<string, { otp: string; expiresAt: number }>();
const inMemoryHighScores: Array<Record<string, unknown>> = [];

// Email validation helper
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

// ======================== API ROUTES ========================

// 1. Health & Status
app.get('/api/health', async (req, res) => {
  const database = await getDb();
  res.json({
    status: 'ok',
    mongodbConnected: !!database && mongoConnected,
    database: 'Pokemon_Arena',
    error: mongoConnectionError,
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
      return res.status(400).json({ error: 'Please enter a valid email address (e.g., trainer@pokemon.com).' });
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

    // Send email via nodemailer or simulation
    const transporter = getTransporter();
    let emailSent = false;
    let mailError: string | null = null;

    if (transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `"Pokémon Arena League" <noreply@pokemonarena.com>`;
        await transporter.sendMail({
          from: fromAddress,
          to: normalizedEmail,
          subject: `🎮 Your Pokémon Arena Verification Code: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f43f5e; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">⚡ Pokémon Arena</h1>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Trainer League Registration</p>
              </div>

              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px 0;">Use the 6-digit one-time password below to verify your email and activate your Trainer Pass:</p>
                <div style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: #020617; padding: 12px 28px; border-radius: 8px; border: 2px solid #0284c7; font-family: monospace;">
                  ${otp}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
              </div>

              <div style="text-align: center; font-size: 12px; color: #64748b;">
                <p>Welcome to the ultimate Pokémon Silhouette Quiz & 1v1 Battle Arena!</p>
              </div>
            </div>
          `,
          text: `Your Pokémon Arena verification code is: ${otp}. It will expire in 10 minutes.`,
        });
        emailSent = true;
      } catch (err: unknown) {
        mailError = err instanceof Error ? err.message : String(err);
        console.error('SMTP send error:', mailError);
      }
    }

    console.log(`🔑 [SIGNUP OTP GENERATED] for ${normalizedEmail}: ${otp} (SMTP Sent: ${emailSent})`);

    return res.json({
      success: true,
      message: emailSent
        ? `A 6-digit verification code has been sent to ${normalizedEmail}.`
        : `Verification code generated for ${normalizedEmail}.`,
      emailSent,
      // Provide preview OTP in development / preview if SMTP is not configured
      previewOtp: !emailSent ? otp : undefined,
      note: !emailSent
        ? 'No external SMTP configured, verification code ready in UI notification.'
        : undefined,
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
      console.log(`✅ Saved new Trainer account to MongoDB: ${normalizedEmail} (${cleanName})`);
    } else {
      inMemoryTrainers.set(normalizedEmail, newAccount);
    }

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
      console.log(`✅ [DIRECT REGISTER] Saved new Trainer to MongoDB: ${normalizedEmail} (${cleanName})`);
    } else {
      inMemoryTrainers.set(normalizedEmail, newAccount);
    }

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

// 4. Login (NO OTP REQUIRED - direct email & password validation)
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

// 5. Sync Account Progress to MongoDB
app.post('/api/account/sync', async (req, res) => {
  try {
    const { account } = req.body;
    if (!account || !account.email) {
      return res.status(400).json({ error: 'Account data with email required.' });
    }

    const normalizedEmail = String(account.email).trim().toLowerCase();
    const database = await getDb();

    if (database) {
      await database.collection('trainers').updateOne(
        { email: normalizedEmail },
        {
          $set: {
            displayName: account.displayName,
            avatarId: account.avatarId,
            title: account.title,
            level: account.level,
            exp: account.exp,
            trophyPoints: account.trophyPoints,
            unlockedAvatars: account.unlockedAvatars,
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
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: false }
      );
    }

    return res.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error syncing account:', errorMsg);
    return res.status(500).json({ error: 'Failed to sync account.' });
  }
});

// 6. Global Leaderboard from MongoDB (Only players who have actually played)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const database = await getDb();
    if (database) {
      const trainers = await database
        .collection('trainers')
        .find(
          {
            $or: [
              { totalGames: { $gt: 0 } },
              { totalScore: { $gt: 0 } },
              { trophyPoints: { $gt: 0 } },
              { totalGuesses: { $gt: 0 } },
            ],
          },
          { projection: { password: 0 } }
        )
        .sort({ trophyPoints: -1, totalScore: -1 })
        .limit(50)
        .toArray();

      return res.json({ success: true, trainers });
    }

    // In-memory fallback: only players who have played
    const memoryTrainers = Array.from(inMemoryTrainers.values())
      .filter((t: any) => (t.totalGames || 0) > 0 || (t.totalScore || 0) > 0 || (t.trophyPoints || 0) > 0)
      .map((t: any) => {
        const { password: _, ...safe } = t;
        return safe;
      })
      .sort((a: any, b: any) => (b.trophyPoints || 0) - (a.trophyPoints || 0));

    return res.json({ success: true, trainers: memoryTrainers });
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
    // Block any bot seed names
    const botNames = new Set(['cynthia', 'leon', 'steven', 'nemona', 'blue', 'lance']);
    if (botNames.has(cleanName.toLowerCase())) {
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
    } else {
      inMemoryHighScores.push(newRecord);
    }

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
        .find({})
        .sort({ score: -1 })
        .limit(100)
        .toArray();

      // Also integrate scores from active registered trainers who have actually played
      const activeTrainers = await database
        .collection('trainers')
        .find(
          {
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
    const botNames = new Set(['cynthia', 'leon', 'steven', 'nemona', 'blue', 'lance']);
    const cleanRecords = records
      .filter((r) => !botNames.has(String(r.playerName || '').toLowerCase().trim()) && Number(r.score) > 0)
      .sort((a, b) => Number(b.score) - Number(a.score));

    return res.json({ success: true, scores: cleanRecords });
  } catch (err: unknown) {
    console.error('Error fetching high scores:', err);
    return res.status(500).json({ error: 'Failed to fetch high scores.' });
  }
});

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pokémon Arena server running on http://0.0.0.0:${PORT}`);
    // Pre-connect to MongoDB
    getDb();
  });
}

startServer();
