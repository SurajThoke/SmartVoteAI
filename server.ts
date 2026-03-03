import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { supabase } from "./src/lib/supabase.ts";
import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || "smart-vote-ai-super-secret-key-2026";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "face-embedding-encryption-key-32-chars-long!";

// --- Resend Setup ---
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Helper Functions ---

const logEvent = async (eventType: string, status: string, description: string, userIdentifier: string, req: express.Request) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await supabase.from('audit_logs').insert({
    event_type: eventType,
    status: status,
    description: description,
    ip_address: String(ip),
    user_identifier: userIdentifier
  });
};

const encrypt = (text: string) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// --- Auth Middleware ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  
  // For demo, if no admin exists, create one
  const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
  if (count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await supabase.from('admins').insert({ id: uuidv4(), email: "admin@smartvote.ai", password: hashedPassword });
  }

  const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
  if (error || !admin) {
    logEvent('login', 'fail', 'Invalid admin email', email, req);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    logEvent('login', 'fail', 'Invalid admin password', email, req);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET);
  logEvent('login', 'success', 'Admin logged in', email, req);
  res.json({ token, user: { email: admin.email, role: 'admin' } });
});

// Send OTP
app.post("/api/otp/send", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  try {
    // Check if voter already exists
    const { data: existing } = await supabase.from('voters').select('*').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await supabase.from('otps').delete().eq('email', email);
    await supabase.from('otps').insert({ email, otp, expires_at: expiresAt });

    // Always log to console for debugging
    console.log(`OTP for ${email}: ${otp}`);
    
    // Send email via Resend in background
    if (process.env.RESEND_API_KEY) {
      console.log(`Attempting to send OTP email to ${email} via Resend...`);
      await resend.emails.send({
        from: 'SmartVoteAI <onboarding@resend.dev>',
        to: email,
        subject: "Your OTP for SmartVoteAI Registration",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-bottom: 16px;">SmartVoteAI Verification</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              Your One-Time Password (OTP) for registration is:
            </p>
            <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              This code will expire in 5 minutes. If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      }).then(response => {
        console.log("Resend Success:", response);
      }).catch(err => {
        console.error("Resend Error Details:", err);
      });
    } else {
      console.warn("RESEND_API_KEY is missing. OTP email will not be sent.");
    }

    logEvent('otp', 'success', 'OTP sent', email, req);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
app.post("/api/otp/verify", async (req, res) => {
  const { email, otp } = req.body;
  const now = new Date().toISOString();

  const { data: record, error } = await supabase.from('otps').select('*').eq('email', email).single();

  if (error || !record) {
    return res.status(400).json({ error: "No OTP found for this email" });
  }

  if (record.is_verified) {
    return res.json({ success: true, message: "Already verified" });
  }

  if (record.attempts >= 3) {
    return res.status(400).json({ error: "Max attempts reached. Please resend OTP." });
  }

  if (record.expires_at < now) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (record.otp !== otp) {
    await supabase.from('otps').update({ attempts: record.attempts + 1 }).eq('email', email);
    logEvent('otp', 'fail', 'Invalid OTP attempt', email, req);
    return res.status(400).json({ error: "Invalid OTP" });
  }

  await supabase.from('otps').update({ is_verified: true }).eq('email', email);
  logEvent('otp', 'success', 'OTP verified', email, req);
  res.json({ success: true, message: "OTP verified successfully" });
});

// Voter Registration
app.post("/api/voter/register", async (req, res) => {
  const { firstName, middleName, lastName, mobile, email, aadhaar, voterId, faceEmbedding } = req.body;

  // Server-side validation
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: "Mobile number must be exactly 10 digits" });
  }
  if (!/^\d{12}$/.test(aadhaar)) {
    return res.status(400).json({ error: "Aadhaar number must be exactly 12 digits" });
  }
  if (!/^[A-Z]{3}\d{5}$/.test(voterId)) {
    return res.status(400).json({ error: "Voter ID must be 3 capital letters followed by 5 digits (e.g. ABC12345)" });
  }

  try {
    // Check OTP verification
    const { data: otpRecord } = await supabase.from('otps').select('*').eq('email', email).eq('is_verified', true).single();
    if (!otpRecord) {
      return res.status(400).json({ error: "Email not verified via OTP" });
    }

    // Check if already exists
    const { data: existing } = await supabase.from('voters').select('*').or(`mobile.eq.${mobile},email.eq.${email},aadhaar.eq.${aadhaar},voter_id.eq.${voterId}`).limit(1);
    if (existing && existing.length > 0) {
      logEvent('registration', 'fail', 'Voter already exists', email, req);
      return res.status(400).json({ error: "Voter already registered with these details" });
    }

    const encryptedEmbedding = encrypt(JSON.stringify(faceEmbedding));
    
    await supabase.from('voters').insert({
      id: uuidv4(),
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      mobile: mobile,
      email: email,
      aadhaar: aadhaar,
      voter_id: voterId,
      face_embedding: encryptedEmbedding,
      is_verified: true
    });

    // Clean up OTP
    await supabase.from('otps').delete().eq('email', email);

    logEvent('registration', 'success', 'Voter registered successfully', email, req);
    res.json({ success: true, message: "Registration successful" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Active Elections
app.get("/api/elections/active", async (req, res) => {
  const now = new Date().toISOString();
  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', true)
    .lte('start_time', now)
    .gte('end_time', now);
  res.json(elections || []);
});

// Get Election Results (Public if ended)
app.get("/api/elections/:id/results", async (req, res) => {
  const { data: election } = await supabase.from('elections').select('*').eq('id', req.params.id).single();
  if (!election) return res.status(404).json({ error: "Election not found" });

  const now = new Date().toISOString();
  const isEnded = election.end_time < now;

  const { data: candidates } = await supabase.from('candidates').select('*').eq('election_id', req.params.id);
  
  const results = await Promise.all((candidates || []).map(async (c) => {
    const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('candidate_id', c.id);
    return { ...c, votes: count || 0 };
  }));

  res.json({ election, results, isEnded });
});

// Admin: Create Election
app.post("/api/admin/elections", authenticateToken, async (req, res) => {
  const { title, organization, description, startTime, endTime, candidates } = req.body;
  
  if (!title || !organization || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const id = uuidv4();
  
  try {
    await supabase.from('elections').insert({
      id, title, organization, description, start_time: startTime, end_time: endTime
    });
    
    if (candidates && Array.isArray(candidates)) {
      const candidateInserts = candidates.map(c => ({
        id: uuidv4(),
        election_id: id,
        name: c.name,
        party_name: c.partyName,
        party_symbol: c.partySymbol
      }));
      await supabase.from('candidates').insert(candidateInserts);
    }

    logEvent('election_create', 'success', `Election created: ${title}`, (req as any).user.email, req);
    res.json({ id, title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create election" });
  }
});

// Admin: Update Election
app.put("/api/admin/elections/:id", authenticateToken, async (req, res) => {
  const { title, organization, description, startTime, endTime, isActive, candidates } = req.body;
  const { id } = req.params;

  if (!title || !organization || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await supabase.from('elections').update({
      title, organization, description, start_time: startTime, end_time: endTime, is_active: isActive
    }).eq('id', id);

    if (candidates && Array.isArray(candidates)) {
      await supabase.from('candidates').delete().eq('election_id', id);
      const candidateInserts = candidates.map(c => ({
        id: uuidv4(),
        election_id: id,
        name: c.name,
        party_name: c.partyName,
        party_symbol: c.partySymbol
      }));
      await supabase.from('candidates').insert(candidateInserts);
    }

    logEvent('election_update', 'success', `Election updated: ${title}`, (req as any).user.email, req);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update election" });
  }
});

// Admin: Get Candidates for Election
app.get("/api/admin/elections/:id/candidates", authenticateToken, async (req, res) => {
  const { data: candidates } = await supabase.from('candidates').select('*').eq('election_id', req.params.id);
  res.json(candidates || []);
});

// Admin: Get Stats
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  const { count: voterCount } = await supabase.from('voters').select('*', { count: 'exact', head: true });
  const { count: electionCount } = await supabase.from('elections').select('*', { count: 'exact', head: true });
  res.json({
    totalVoters: voterCount || 0,
    totalElections: electionCount || 0,
    status: "Healthy"
  });
});

// Admin: Add Candidate
app.post("/api/admin/candidates", authenticateToken, async (req, res) => {
  const { electionId, name, partyName, partySymbol } = req.body;
  const id = uuidv4();
  await supabase.from('candidates').insert({
    id, election_id: electionId, name, party_name: partyName, party_symbol: partySymbol
  });
  res.json({ id, name });
});

// Admin: Get Audit Logs
app.get("/api/admin/audit-logs", authenticateToken, async (req, res) => {
  const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
  res.json(logs || []);
});

// Voting: Verify Face and Get Voter
app.post("/api/vote/verify-face", async (req, res) => {
  const { voterId, currentEmbedding } = req.body;

  const { data: voter, error } = await supabase.from('voters').select('*').eq('voter_id', voterId).single();
  if (error || !voter) {
    logEvent('face_verify', 'fail', 'Voter not found', voterId, req);
    return res.status(404).json({ error: "Voter not found" });
  }

  const storedEmbedding = JSON.parse(decrypt(voter.face_embedding));
  
  // Euclidean Distance
  const distance = Math.sqrt(
    currentEmbedding.reduce((sum: number, val: number, i: number) => sum + Math.pow(val - storedEmbedding[i], 2), 0)
  );

  const threshold = 0.5;
  if (distance < threshold) {
    logEvent('face_verify', 'success', `Face matched (dist: ${distance.toFixed(4)})`, voterId, req);
    // Generate a temporary voting session token
    const voteToken = jwt.sign({ voterId: voter.id, voterIdentifier: voter.voter_id }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ success: true, voter: { firstName: voter.first_name, lastName: voter.last_name, mobile: voter.mobile }, voteToken });
  } else {
    logEvent('face_verify', 'fail', `Face mismatch (dist: ${distance.toFixed(4)})`, voterId, req);
    res.status(401).json({ error: "Face not recognized" });
  }
});

// Cast Vote
app.post("/api/vote/cast", async (req, res) => {
  const { voteToken, electionId, candidateId } = req.body;

  try {
    const decoded = jwt.verify(voteToken, JWT_SECRET) as any;
    const voterId = decoded.voterId;
    const voterIdentifier = decoded.voterIdentifier;

    // Check if already voted in this election
    const voterHash = CryptoJS.SHA256(voterId + electionId).toString();
    const { data: existingVote } = await supabase.from('votes').select('*').eq('voter_hash', voterHash).eq('election_id', electionId).limit(1);
    
    if (existingVote && existingVote.length > 0) {
      logEvent('vote', 'fail', 'Double voting attempt', voterIdentifier, req);
      return res.status(400).json({ error: "You have already voted in this election" });
    }

    const transactionId = uuidv4();
    const voteHash = CryptoJS.SHA256(electionId + candidateId + uuidv4()).toString();

    await supabase.from('votes').insert({
      id: uuidv4(),
      election_id: electionId,
      candidate_id: candidateId,
      voter_hash: voterHash,
      transaction_id: transactionId,
      vote_hash: voteHash
    });

    logEvent('vote', 'success', 'Vote cast successfully', voterIdentifier, req);
    res.json({ success: true, transactionId, voteHash });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired voting session" });
  }
});

// --- Vite Integration ---

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("dist");
    const indexPath = path.join(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      console.error(`CRITICAL ERROR: index.html not found at ${indexPath}. Make sure 'npm run build' completed successfully.`);
    }

    app.use(express.static(distPath));
    
    // SPA fallback: serve index.html for all non-API routes
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(indexPath);
      }
    });
  }

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer();
