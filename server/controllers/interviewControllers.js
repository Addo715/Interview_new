// src/controllers/interviewControllers.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptTemplate from '../lib/prompt.js'; // This is your 3000-line masterpiece

const genAI = new GoogleGenerativeAI(process.env.GEMINI_SECRET_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // or gemini-1.5-flash for speed

const interviewSessions = new Map();

// Helper: Replace placeholders in the master prompt
const generateInterviewAssistantPrompt = ({
  company,
  position,
  objectives,
  codingLanguage,
  uploadedDocumentContent,
}) => {
  let fullPrompt = promptTemplate;

  return fullPrompt
    .replace(/{company}/g, company || 'this company')
    .replace(/{position}/g, position || 'this role')
    .replace(/{objectives}/g, objectives || 'advancing my career and making an impact')
    .replace(/{codingLanguage}/g, codingLanguage || 'JavaScript')
    .replace(/{uploadedDocumentContent}/g, uploadedDocumentContent || 'No resume uploaded.');
};

// Format the recruiter's live question
const formatQuestionForAI = (question) => {
  return `The recruiter just asked: "${question}"\n\nProvide a concise, natural, first-person answer the candidate can say right now. Follow the exact formatting rules from the prompt.`;
};

// Add conversation context (last 3 exchanges)
const createInterviewContext = (conversationHistory) => {
  if (conversationHistory.length === 0) return '';
  const recent = conversationHistory.slice(-3);
  return (
    `PREVIOUS EXCHANGES (for context only):\n` +
    recent
      .map(
        (item, i) =>
          `${i + 1}. Q: ${item.question}\n   A: ${item.candidateSpoke || item.aiSuggestion}`
      )
      .join('\n\n') +
    '\n\nNow answer the new question:\n'
  );
};

// Validation
const validateCandidateData = (data) => {
  const errors = [];
  if (!data.company) errors.push('Company name is required');
  if (!data.position) errors.push('Position is required');
  if (!data.objectives) errors.push('Career objectives are required');
  return { isValid: errors.length === 0, errors };
};

// 1. Initialize Interview
export const initializeInterview = async (req, res) => {
  try {
    const { company, position, objectives, codingLanguage, uploadedDocumentContent, interviewType } =
      req.body;

    const validation = validateCandidateData({ company, position, objectives });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const aiPrompt = generateInterviewAssistantPrompt({
      company,
      position,
      objectives,
      codingLanguage,
      uploadedDocumentContent,
    });

    const sessionData = {
      sessionId,
      candidateInfo: { company, position, objectives, codingLanguage, uploadedDocumentContent },
      interviewType: interviewType || 'technical',
      aiPrompt,
      conversationHistory: [],
      startTime: new Date(),
      status: 'active',
    };

    interviewSessions.set(sessionId, sessionData);

    console.log('Interview session started:', sessionId);
    res.status(200).json({
      success: true,
      sessionId,
      message: 'Ready! Send recruiter questions in real-time.',
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Process Recruiter Question (REAL-TIME)
export const processRecruiterQuestion = async (req, res) => {
  try {
    const { sessionId, question } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is empty' });
    }

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const formattedQuestion = formatQuestionForAI(question);
    const context = createInterviewContext(session.conversationHistory);

    const completePrompt = `${session.aiPrompt}\n\n${context}${formattedQuestion}`;

    console.log('Sending to Gemini...');
    const result = await model.generateContent(completePrompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Save to history
    session.conversationHistory.push({
      timestamp: new Date(),
      question,
      aiSuggestion: aiResponse,
    });
    interviewSessions.set(sessionId, session);

    res.status(200).json({
      success: true,
      sessionId,
      recruiterQuestion: question,
      aiAnswerSuggestion: aiResponse.trim(),
      message: 'Speak this naturally!',
    });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Save what candidate actually said (optional)
export const saveAIResponse = async (req, res) => {
  try {
    const { sessionId, question, aiResponse, candidateSpoke } = req.body;
    const session = interviewSessions.get(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.conversationHistory.push({
      timestamp: new Date(),
      question,
      aiSuggestion: aiResponse,
      candidateSpoke: candidateSpoke || null,
    });
    interviewSessions.set(sessionId, session);

    res.status(200).json({ success: true, message: 'Saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. End Interview
export const endInterview = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = interviewSessions.get(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'completed';
    session.endTime = new Date();
    const duration = Math.floor((session.endTime - session.startTime) / 60000);

    interviewSessions.set(sessionId, session);

    res.status(200).json({
      success: true,
      summary: {
        company: session.candidateInfo.company,
        position: session.candidateInfo.position,
        durationMinutes: duration,
        questionsAnswered: session.conversationHistory.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Smart Questions to Ask Recruiter
export const getSmartQuestions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = interviewSessions.get(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const questions = [
      `What does success look like in the first 6 months for this ${session.candidateInfo.position} role?`,
      `Can you tell me more about the team I'll be working with?`,
      `What are the biggest challenges the team is facing right now?`,
      `How does ${session.candidateInfo.company} support professional growth?`,
      `What's the typical career path for someone in this position?`,
    ];

    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Conversation History
export const getConversationHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = interviewSessions.get(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    res.status(200).json({
      success: true,
      history: session.conversationHistory,
      total: session.conversationHistory.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Direct Gemini Call (for debugging)
export const callGeminiAI = async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.status(200).json({ success: true, aiResponse: response.text() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};