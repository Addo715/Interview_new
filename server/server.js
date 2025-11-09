// src/server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import interviewRoutes from "../server/routes/interviewRoutes.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/interview", interviewRoutes);

// Health check / root route
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// Test Gemini API key
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    hasApiKey: !!process.env.GEMINI_SECRET_KEY,
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

});

export default app;