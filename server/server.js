// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import interviewRoutes from "../server/routes/interviewRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder (where .env is located)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check if API key is loaded
console.log('🔑 Checking API Key...');
console.log('GEMINI_SECRET_KEY loaded:', process.env.GEMINI_SECRET_KEY ? 'YES ✅' : 'NO ❌');
if (!process.env.GEMINI_SECRET_KEY) {
  console.error('❌ CRITICAL: GEMINI_SECRET_KEY not found in environment variables!');
  console.error('❌ Make sure .env file exists in server folder');
}

// FIXED CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// INCREASE PAYLOAD SIZE LIMIT (Fix 413 error)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use("/api/interview", interviewRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    hasApiKey: !!process.env.GEMINI_SECRET_KEY,
    apiKeyPreview: process.env.GEMINI_SECRET_KEY ? process.env.GEMINI_SECRET_KEY.substring(0, 10) + '...' : 'NOT FOUND',
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for http://localhost:5173`);
  console.log(`✅ Payload limit: 50mb`);
  console.log(`✅ API Key status: ${process.env.GEMINI_SECRET_KEY ? 'Loaded' : '❌ MISSING'}`);
});

export default app;