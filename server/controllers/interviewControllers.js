// server/controllers/interviewControllers.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptTemplate from '../lib/prompt.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_SECRET_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const interviewSessions = new Map();

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
    const { company, position, objectives, codingLanguage, uploadedDocumentContent, interviewType } = req.body;

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

    console.log('✅ Interview session started:', sessionId);
    res.status(200).json({
      success: true,
      sessionId,
      message: 'Ready! Send recruiter questions in real-time.',
    });
  } catch (error) {
    console.error('❌ Init error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Process Recruiter Question (REAL-TIME) - FIXED
export const processRecruiterQuestion = async (req, res) => {
  try {
    const { sessionId, transcript, lastUserMessage } = req.body;

    console.log('📥 Received request:', { sessionId, lastUserMessage });

    // Check if message is empty
    if (!lastUserMessage || lastUserMessage.trim() === '') {
      console.log('⚠️ Empty message, skipping');
      return res.status(200).json({ 
        success: true, 
        aiResponse: null,
        shouldAskQuestion: null 
      });
    }

    // Check session exists
    const session = interviewSessions.get(sessionId);
    if (!session) {
      console.error('❌ Session not found:', sessionId);
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    console.log('✅ Session found for:', sessionId);

    // Create prompt for Gemini
    const formattedQuestion = `The recruiter just asked: "${lastUserMessage}"\n\nProvide a concise, natural, first-person answer the candidate can say right now. Keep it brief (2-3 sentences).`;
    
    const completePrompt = `${session.aiPrompt}\n\n${formattedQuestion}`;

    console.log('🤖 Sending to Gemini AI...');
    console.log('Question:', lastUserMessage);

    // Call Gemini API
    const result = await model.generateContent(completePrompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('✅ Gemini response:', aiResponse);

    // Save to history
    session.conversationHistory.push({
      timestamp: new Date(),
      question: lastUserMessage,
      aiSuggestion: aiResponse,
    });
    interviewSessions.set(sessionId, session);

    // Return response
    res.status(200).json({
      success: true,
      aiResponse: aiResponse.trim(),
      shouldAskQuestion: null
    });

    console.log('✅ Response sent to frontend');

  } catch (error) {
    console.error('❌ Gemini error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
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