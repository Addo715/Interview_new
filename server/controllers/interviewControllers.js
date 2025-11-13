// // server/controllers/interviewControllers.js
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import promptTemplate from '../lib/prompt.js';

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI("AIzaSyCz91-GaXnx9McFu9byjcJqBlcEYLUi7Ag");
// const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// const interviewSessions = new Map();

// const generateInterviewAssistantPrompt = ({
//   company,
//   position,
//   objectives,
//   codingLanguage,
//   uploadedDocumentContent,
// }) => {
//   let fullPrompt = promptTemplate;

//   return fullPrompt
//     .replace(/{company}/g, company || 'this company')
//     .replace(/{position}/g, position || 'this role')
//     .replace(/{objectives}/g, objectives || 'advancing my career and making an impact')
//     .replace(/{codingLanguage}/g, codingLanguage || 'JavaScript')
//     .replace(/{uploadedDocumentContent}/g, uploadedDocumentContent || 'No resume uploaded.');
// };

// const validateCandidateData = (data) => {
//   const errors = [];
//   if (!data.company) errors.push('Company name is required');
//   if (!data.position) errors.push('Position is required');
//   if (!data.objectives) errors.push('Career objectives are required');
//   return { isValid: errors.length === 0, errors };
// };

// // 1. Initialize Interview
// export const initializeInterview = async (req, res) => {
//   try {
//     const { company, position, objectives, codingLanguage, uploadedDocumentContent, interviewType } = req.body;

//     const validation = validateCandidateData({ company, position, objectives });
//     if (!validation.isValid) {
//       return res.status(400).json({ success: false, errors: validation.errors });
//     }

//     const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//     const aiPrompt = generateInterviewAssistantPrompt({
//       company,
//       position,
//       objectives,
//       codingLanguage,
//       uploadedDocumentContent,
//     });

//     const sessionData = {
//       sessionId,
//       candidateInfo: { company, position, objectives, codingLanguage, uploadedDocumentContent },
//       interviewType: interviewType || 'technical',
//       aiPrompt,
//       conversationHistory: [],
//       startTime: new Date(),
//       status: 'active',
//     };

//     interviewSessions.set(sessionId, sessionData);

//     console.log('✅ Interview session started:', sessionId);
//     res.status(200).json({
//       success: true,
//       sessionId,
//       message: 'Ready! Send recruiter questions in real-time.',
//     });
//   } catch (error) {
//     console.error('❌ Init error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 2. Process Recruiter Question - SIMPLIFIED VERSION
// export const processRecruiterQuestion = async (req, res) => {
//   try {
//     const { sessionId, lastUserMessage } = req.body;

//     console.log('\n' + '='.repeat(60));
//     console.log('📥 NEW REQUEST');
//     console.log('Session:', sessionId?.slice(-8));
//     console.log('Question:', lastUserMessage);
//     console.log('='.repeat(60));

//     // Validate
//     if (!sessionId) {
//       console.error('❌ No sessionId');
//       return res.status(400).json({ success: false, message: 'SessionId required' });
//     }

//     if (!lastUserMessage || lastUserMessage.trim() === '') {
//       console.log('⏭️ Empty message, skipping');
//       return res.status(200).json({ success: true, aiResponse: null });
//     }

//     // Get session
//     const session = interviewSessions.get(sessionId);
//     if (!session) {
//       console.error('❌ Session not found');
//       return res.status(404).json({ success: false, message: 'Session not found' });
//     }

//     console.log('✅ Session found');

//     // Create simple prompt
//     const prompt = `You are an AI interview assistant helping a candidate answer interview questions.

// Candidate Info:
// - Company: ${session.candidateInfo.company}
// - Position: ${session.candidateInfo.position}
// - Objectives: ${session.candidateInfo.objectives}

// The recruiter just asked: "${lastUserMessage}"

// Provide a brief, professional, first-person answer (2-3 sentences) that the candidate can say right now. Sound natural and conversational.`;

//     console.log('🤖 Calling Gemini API...');

//     try {
//       // Call Gemini
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const aiResponse = response.text();

//       console.log('✅ Gemini responded!');
//       console.log('Response preview:', aiResponse.substring(0, 100) + '...');

//       // Save to history
//       session.conversationHistory.push({
//         timestamp: new Date(),
//         question: lastUserMessage,
//         aiSuggestion: aiResponse,
//       });

//       console.log('✅ Sending response to frontend\n');

//       return res.status(200).json({
//         success: true,
//         aiResponse: aiResponse.trim()
//       });

//     } catch (apiError) {
//       console.error('❌ Gemini API Error:', apiError.message);
      
//       if (apiError.message?.includes('API_KEY_INVALID') || apiError.message?.includes('API key not valid')) {
//         console.error('🔴 YOUR API KEY IS INVALID!');
//         console.error('👉 Get a new one: https://aistudio.google.com/app/apikey');
//         return res.status(500).json({ 
//           success: false, 
//           message: 'Invalid API Key. Please update your .env file with a valid key from https://aistudio.google.com/app/apikey'
//         });
//       }

//       return res.status(500).json({ 
//         success: false, 
//         message: apiError.message 
//       });
//     }

//   } catch (error) {
//     console.error('❌ General Error:', error.message);
//     return res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

// // 3. Save AI Response
// export const saveAIResponse = async (req, res) => {
//   try {
//     const { sessionId, question, aiResponse, candidateSpoke } = req.body;
//     const session = interviewSessions.get(sessionId);
//     if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

//     session.conversationHistory.push({
//       timestamp: new Date(),
//       question,
//       aiSuggestion: aiResponse,
//       candidateSpoke: candidateSpoke || null,
//     });
//     interviewSessions.set(sessionId, session);

//     res.status(200).json({ success: true, message: 'Saved' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 4. End Interview
// export const endInterview = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     const session = interviewSessions.get(sessionId);
//     if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

//     session.status = 'completed';
//     session.endTime = new Date();
//     const duration = Math.floor((session.endTime - session.startTime) / 60000);

//     res.status(200).json({
//       success: true,
//       summary: {
//         company: session.candidateInfo.company,
//         position: session.candidateInfo.position,
//         durationMinutes: duration,
//         questionsAnswered: session.conversationHistory.length,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 5. Get Smart Questions
// export const getSmartQuestions = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const session = interviewSessions.get(sessionId);
//     if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

//     const questions = [
//       `What does success look like in the first 6 months for this ${session.candidateInfo.position} role?`,
//       `Can you tell me more about the team I'll be working with?`,
//       `What are the biggest challenges the team is facing right now?`,
//       `How does ${session.candidateInfo.company} support professional growth?`,
//       `What's the typical career path for someone in this position?`,
//     ];

//     res.status(200).json({ success: true, questions });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 6. Get Conversation History
// export const getConversationHistory = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const session = interviewSessions.get(sessionId);
//     if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

//     res.status(200).json({
//       success: true,
//       history: session.conversationHistory,
//       total: session.conversationHistory.length,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 7. Test Gemini API
// export const callGeminiAI = async (req, res) => {
//   try {
//     console.log('🧪 Testing Gemini API...');
//     const { prompt } = req.body;
//     const result = await model.generateContent(prompt || 'Say hello in one sentence');
//     const response = await result.response;
//     console.log('✅ Test successful!');
//     res.status(200).json({ 
//       success: true, 
//       aiResponse: response.text(),
//       message: 'API is working!'
//     });
//   } catch (error) {
//     console.error('❌ Test failed:', error.message);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message,
//       hint: 'Check your API key at https://aistudio.google.com/app/apikey'
//     });
//   }
// };


// server/controllers/interviewControllers.js - ENHANCED VERSION
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptTemplate from '../lib/prompt.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI("AIzaSyCz91-GaXnx9McFu9byjcJqBlcEYLUi7Ag"); // Replace with your key
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash', // Use latest model for best performance
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

const interviewSessions = new Map();

// Generate enhanced prompt
const generateInterviewAssistantPrompt = ({
  company,
  position,
  objectives,
  codingLanguage,
  uploadedDocumentContent,
}) => {
  return promptTemplate
    .replace(/{company}/g, company || 'this company')
    .replace(/{position}/g, position || 'this role')
    .replace(/{objectives}/g, objectives || 'advancing my career')
    .replace(/{codingLanguage}/g, codingLanguage || 'JavaScript')
    .replace(/{uploadedDocumentContent}/g, uploadedDocumentContent || 'No resume uploaded.');
};

// Validation
const validateCandidateData = (data) => {
  const errors = [];
  if (!data.company) errors.push('Company name is required');
  if (!data.position) errors.push('Position is required');
  if (!data.objectives) errors.push('Career objectives are required');
  return { isValid: errors.length === 0, errors };
};

// 1. Initialize Interview Session
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
      codingLanguage: codingLanguage || 'JavaScript',
      uploadedDocumentContent: uploadedDocumentContent || 'No background provided',
    });

    const sessionData = {
      sessionId,
      candidateInfo: { company, position, objectives, codingLanguage: codingLanguage || 'JavaScript', uploadedDocumentContent },
      interviewType: interviewType || 'technical',
      aiPrompt,
      conversationHistory: [],
      screenAnalysisHistory: [],
      startTime: new Date(),
      status: 'active',
    };

    interviewSessions.set(sessionId, sessionData);

    console.log('✅ Interview session initialized:', sessionId);
    res.status(200).json({
      success: true,
      sessionId,
      message: 'Interview assistant ready! You can now use voice recording or screen analysis.',
    });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Process Voice Transcript (Regular Q&A)
export const processRecruiterQuestion = async (req, res) => {
  try {
    const { sessionId, lastUserMessage } = req.body;

    console.log('\n' + '='.repeat(60));
    console.log('📥 VOICE TRANSCRIPT PROCESSING');
    console.log('Session:', sessionId?.slice(-8));
    console.log('Question:', lastUserMessage);
    console.log('='.repeat(60));

    if (!sessionId || !lastUserMessage?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'SessionId and question required' 
      });
    }

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found. Please restart interview.' 
      });
    }

    // Create context-aware prompt
    const conversationContext = session.conversationHistory
      .slice(-3) // Last 3 exchanges for context
      .map(h => `Q: ${h.question}\nA: ${h.aiSuggestion}`)
      .join('\n\n');

    const prompt = `${session.aiPrompt}

CONVERSATION HISTORY:
${conversationContext || 'No previous questions'}

CURRENT QUESTION FROM INTERVIEWER:
"${lastUserMessage}"

Provide your response using PROTOCOL A (Lightning-Fast Text Answers) format. Be concise, natural, and first-person. Include specific details from the candidate's background when relevant.`;

    console.log('🤖 Calling Gemini API for voice response...');

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      console.log('✅ AI Response generated');

      // Save to history
      session.conversationHistory.push({
        timestamp: new Date(),
        question: lastUserMessage,
        aiSuggestion: aiResponse,
        type: 'voice'
      });

      return res.status(200).json({
        success: true,
        aiResponse: aiResponse.trim()
      });

    } catch (apiError) {
      console.error('❌ Gemini API Error:', apiError.message);
      return res.status(500).json({ 
        success: false, 
        message: `AI Error: ${apiError.message}. Check your API key.`
      });
    }

  } catch (error) {
    console.error('❌ Processing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 3. 🚀 NEW: SCREEN ANALYSIS ENDPOINT (For "Analysis Screen" button)
export const analyzeScreen = async (req, res) => {
  try {
    const { sessionId, screenContent, analysisType } = req.body;

    console.log('\n' + '🔥'.repeat(30));
    console.log('🖥️  SCREEN ANALYSIS MODE ACTIVATED');
    console.log('Session:', sessionId?.slice(-8));
    console.log('Analysis Type:', analysisType || 'auto-detect');
    console.log('Content Length:', screenContent?.length || 0);
    console.log('🔥'.repeat(30) + '\n');

    if (!sessionId || !screenContent?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'SessionId and screen content required' 
      });
    }

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Enhanced screen analysis prompt
    const analysisPrompt = `${session.aiPrompt}

🚨 SCREEN ANALYSIS MODE - PRIORITY RESPONSE REQUIRED 🚨

You are analyzing content from the candidate's screen during a LIVE interview. This could be:
- A coding problem (LeetCode, HackerRank, CoderPad, IDE)
- A technical question displayed on screen
- System design diagram or requirements
- Interview notes or questions

SCREEN CONTENT:
"""
${screenContent}
"""

CANDIDATE'S PRIMARY LANGUAGE: ${session.candidateInfo.codingLanguage}

INSTRUCTIONS:
1. **IMMEDIATELY identify** what type of content this is:
   - Coding problem → Use PROTOCOL B (Live Coding Screen Analysis)
   - Technical question → Use PROTOCOL A with technical depth
   - Behavioral question → Use PROTOCOL C (STAR Method)
   - System design → Use PROTOCOL E (System Design)

2. **Provide COMPLETE, WORKING solutions** - not pseudocode
   - Write production-ready code in ${session.candidateInfo.codingLanguage}
   - Include time/space complexity analysis
   - Add edge case handling
   - Provide test cases

3. **Format for INSTANT readability**:
   - Use clear section headers
   - Highlight key points
   - Make code copy-paste ready

4. **Be FAST** - candidate is in a live interview!

RESPOND NOW with the complete solution!`;

    console.log('🤖 Calling Gemini for screen analysis...');

    try {
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const aiAnalysis = response.text();

      console.log('✅ Screen analysis complete!');
      console.log('Response length:', aiAnalysis.length);

      // Save to screen analysis history
      session.screenAnalysisHistory.push({
        timestamp: new Date(),
        screenContent: screenContent.substring(0, 500) + '...', // Store preview
        aiAnalysis,
        analysisType: analysisType || 'auto'
      });

      return res.status(200).json({
        success: true,
        aiAnalysis: aiAnalysis.trim(),
        analysisType: analysisType || 'auto',
        timestamp: new Date().toISOString()
      });

    } catch (apiError) {
      console.error('❌ Screen Analysis API Error:', apiError.message);
      return res.status(500).json({ 
        success: false, 
        message: `Screen analysis failed: ${apiError.message}`
      });
    }

  } catch (error) {
    console.error('❌ Screen analysis error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 4. Get Smart Follow-up Questions
export const getSmartQuestions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = interviewSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Generate contextual questions based on conversation
    const questions = [
      `What does success look like in the first 6 months for this ${session.candidateInfo.position} role?`,
      `Can you walk me through a typical day for someone in this position?`,
      `What are the biggest technical challenges your team is currently facing?`,
      `How does ${session.candidateInfo.company} approach professional development and learning?`,
      `What's the team structure, and who would I be working most closely with?`,
      `What technologies is the team most excited about adopting in the near future?`,
      `How do you measure success for this role?`,
      `What's the typical career progression path for someone in this position?`,
    ];

    res.status(200).json({ 
      success: true, 
      questions,
      sessionInfo: {
        company: session.candidateInfo.company,
        position: session.candidateInfo.position
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 5. Get Full Session History
export const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = interviewSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    res.status(200).json({
      success: true,
      sessionId,
      candidateInfo: session.candidateInfo,
      conversationHistory: session.conversationHistory,
      screenAnalysisHistory: session.screenAnalysisHistory,
      stats: {
        totalQuestions: session.conversationHistory.length,
        totalScreenAnalyses: session.screenAnalysisHistory.length,
        duration: Math.floor((new Date() - session.startTime) / 60000) + ' minutes',
        status: session.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 6. End Interview Session
export const endInterview = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = interviewSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    session.status = 'completed';
    session.endTime = new Date();
    const durationMinutes = Math.floor((session.endTime - session.startTime) / 60000);

    console.log('✅ Interview session ended:', sessionId);

    res.status(200).json({
      success: true,
      summary: {
        company: session.candidateInfo.company,
        position: session.candidateInfo.position,
        durationMinutes,
        questionsAnswered: session.conversationHistory.length,
        screenAnalyses: session.screenAnalysisHistory.length,
        startTime: session.startTime,
        endTime: session.endTime
      },
      message: 'Interview session completed successfully!'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 7. Test Gemini Connection
export const testGeminiAPI = async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    const testPrompt = req.body.prompt || 'Respond with "API is working!" if you can read this.';
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    
    console.log('✅ Gemini API test successful!');
    
    res.status(200).json({ 
      success: true, 
      aiResponse: response.text(),
      message: '🎉 Gemini API is working perfectly!',
      model: 'gemini-2.0-flash-exp'
    });
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: `API Test Failed: ${error.message}`,
      hint: 'Check your API key at https://aistudio.google.com/app/apikey',
      errorDetails: error.response?.data || error.message
    });
  }
};


export const processPastedQuestion = async (req, res) => {
  try {
    const { sessionId, pastedContent } = req.body;

    console.log('\n' + '📋'.repeat(30));
    console.log('📋 PASTED QUESTION PROCESSING');
    console.log('Session:', sessionId?.slice(-8));
    console.log('Content Length:', pastedContent?.length);
    console.log('📋'.repeat(30) + '\n');

    if (!sessionId || !pastedContent?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'SessionId and question content required' 
      });
    }

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Detect if it's a coding question
    const isCodingQuestion = 
      pastedContent.includes('function') || 
      pastedContent.includes('class') ||
      pastedContent.includes('Example:') ||
      pastedContent.includes('Input:') ||
      pastedContent.includes('Output:') ||
      pastedContent.includes('Constraints:') ||
      pastedContent.toLowerCase().includes('leetcode') ||
      pastedContent.toLowerCase().includes('solve') ||
      pastedContent.toLowerCase().includes('algorithm') ||
      pastedContent.toLowerCase().includes('given') ||
      pastedContent.toLowerCase().includes('return');

    const promptType = isCodingQuestion ? 'CODING' : 'REGULAR';

    const prompt = `${session.aiPrompt}

🎯 PASTED ${promptType} QUESTION - INSTANT SOLUTION REQUIRED

QUESTION CONTENT:
"""
${pastedContent}
"""

CANDIDATE'S PRIMARY LANGUAGE: ${session.candidateInfo.codingLanguage}

${isCodingQuestion ? `
CODING SOLUTION REQUIREMENTS:
1. Provide COMPLETE, WORKING code in ${session.candidateInfo.codingLanguage}
2. Include detailed explanation of approach
3. Add time and space complexity analysis
4. Include 2-3 test cases with expected outputs
5. Highlight edge cases
6. Make code production-ready and well-commented
7. NO PSEUDOCODE - Only actual working code

FORMAT YOUR RESPONSE AS:

**SOLUTION APPROACH:**
[Brief explanation of the solution strategy]

**CODE:**
\`\`\`${session.candidateInfo.codingLanguage.toLowerCase()}
// Complete working code here - NO PLACEHOLDERS
// Include all necessary logic
\`\`\`

**COMPLEXITY:**
- Time: O(?)
- Space: O(?)

**TEST CASES:**
Example 1:
Input: [example]
Output: [result]

Example 2:
Input: [example]
Output: [result]

**EDGE CASES:**
- [List important edge cases to consider]
` : `
Provide a clear, professional, first-person answer to this question.
Be specific and use examples from the candidate's background when relevant.
Keep it concise but complete.
`}

RESPOND NOW:`;

    console.log('🤖 Calling Gemini for pasted question...');

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      console.log('✅ Solution generated!');
      console.log('Response length:', aiResponse.length);

      // Save to history
      session.conversationHistory.push({
        timestamp: new Date(),
        question: pastedContent.substring(0, 500) + (pastedContent.length > 500 ? '...' : ''),
        aiSuggestion: aiResponse,
        type: 'pasted',
        questionType: promptType
      });

      return res.status(200).json({
        success: true,
        aiResponse: aiResponse.trim(),
        questionType: promptType,
        timestamp: new Date().toISOString()
      });

    } catch (apiError) {
      console.error('❌ Gemini API Error:', apiError.message);
      return res.status(500).json({ 
        success: false, 
        message: `AI Error: ${apiError.message}`
      });
    }

  } catch (error) {
    console.error('❌ Pasted question processing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};