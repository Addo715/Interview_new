// src/routes/interviewRoutes.js
import express from 'express';
import {
  initializeInterview,
  processRecruiterQuestion,
  saveAIResponse,
  endInterview,
  getSmartQuestions,
  getConversationHistory,
  callGeminiAI,
} from '../controllers/interviewControllers.js';

const router = express.Router();

// 1. Initialize interview session
router.post('/initialize', initializeInterview);

// 2. Process live recruiter question → get AI answer suggestion (REAL-TIME)
router.post('/question', processRecruiterQuestion);

// 3. Save what the candidate actually said (optional)
router.post('/save-response', saveAIResponse);

// 4. Get smart questions to ask the recruiter
router.get('/:sessionId/smart-questions', getSmartQuestions);

// 5. Get full conversation history
router.get('/:sessionId/history', getConversationHistory);

// 6. End interview session
router.post('/end', endInterview);

// 7. Direct call to Gemini (for debugging or testing)
router.post('/gemini', callGeminiAI);

export default router;