// // server/routes/interviewRoutes.js
// import express from 'express';
// import {
//   initializeInterview,
//   processRecruiterQuestion,
//   saveAIResponse,
//   endInterview,
//   getSmartQuestions,
//   getConversationHistory,
//   callGeminiAI,
//   analyzeScreen,
//   processPastedQuestion
// } from '../controllers/interviewControllers.js';

// const router = express.Router();

// // 1. Initialize interview session (frontend calls /interview/start)
// router.post('/start', initializeInterview);
// router.post('/initialize', initializeInterview);

// // 2. Process live transcript → get AI answer (REAL-TIME)
// router.post('/transcript', processRecruiterQuestion);
// router.post('/question', processRecruiterQuestion);

// // 3. Save what the candidate actually said (optional)
// router.post('/save-response', saveAIResponse);

// // 4. Get smart questions to ask the recruiter
// router.get('/:sessionId/smart-questions', getSmartQuestions);

// // 5. Get full conversation history
// router.get('/:sessionId/history', getConversationHistory);

// // 6. End interview session
// router.post('/end', endInterview);

// // 7. Direct call to Gemini (for debugging or testing)
// router.post('/gemini', callGeminiAI);

// // 8. Analze screen 
// router.post('/analyze-screen', analyzeScreen);

// // Process pasted coding questions (NEW)
// router.post('/paste-question', processPastedQuestion);

// export default router;

// server/routes/interviewRoutes.js - FIXED VERSION
import express from 'express';
import {
  initializeInterview,
  processRecruiterQuestion,
  endInterview,
  getSmartQuestions,
  getSessionHistory,
  analyzeScreen,
  processPastedQuestion,
  testGeminiAPI
} from '../controllers/interviewControllers.js';

const router = express.Router();

// 1. Initialize interview session
router.post('/start', initializeInterview);
router.post('/initialize', initializeInterview);

// 2. Process live transcript → get AI answer
router.post('/transcript', processRecruiterQuestion);
router.post('/question', processRecruiterQuestion);

// 3. Get smart questions to ask the recruiter
router.get('/:sessionId/smart-questions', getSmartQuestions);

// 4. Get full conversation history
router.get('/:sessionId/history', getSessionHistory);

// 5. End interview session
router.post('/end', endInterview);

// 6. Test Gemini API
router.post('/test-gemini', testGeminiAPI);

// 7. Analyze screen
router.post('/analyze-screen', analyzeScreen);

// 8. Process pasted coding questions
router.post('/paste-question', processPastedQuestion);

export default router;