// // client/src/Components/Interview.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation } from 'react-router-dom';
// import api from '../api/api';

// const Interview = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [transcript, setTranscript] = useState('');
//   const [mediaStream, setMediaStream] = useState(null);
//   const [recognition, setRecognition] = useState(null);
//   const [sessionId, setSessionId] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);

//   const lastProcessedTranscript = useRef('');
//   const processingQueue = useRef([]);
//   const isProcessingRef = useRef(false);
//   const location = useLocation();

//   useEffect(() => {
//     if (location.state?.sessionId) {
//       setSessionId(location.state.sessionId);
//       console.log('✅ Session ID loaded:', location.state.sessionId);
      
//       // Add initial AI greeting
//       const greetingMessage = {
//         id: Date.now(),
//         text: '👋 Hi! I\'m your AI interview assistant. I\'ll help you answer questions in real-time. Start recording and speak when the recruiter asks a question.',
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages([greetingMessage]);
//     } else {
//       console.error('❌ No session ID found!');
//       alert('❌ Session error. Please go back and start again.');
//     }
//   }, [location]);

//   // Process queue one at a time
//   const processQueue = async () => {
//     if (isProcessingRef.current || processingQueue.current.length === 0) {
//       return;
//     }

//     const userText = processingQueue.current.shift();
//     await sendToGemini(userText);
    
//     // Process next item if queue is not empty
//     if (processingQueue.current.length > 0) {
//       setTimeout(processQueue, 500);
//     }
//   };

//   const sendToGemini = async (userText) => {
//     if (!sessionId) {
//       console.error('❌ No sessionId available');
//       return;
//     }

//     if (!userText || userText.trim() === '') {
//       console.log('⏭️ Empty text, skipping');
//       return;
//     }

//     isProcessingRef.current = true;
//     setIsProcessing(true);

//     try {
//       console.log('📤 Sending to Gemini:', userText);
//       console.log('📤 SessionId:', sessionId);
      
//       const res = await api.post('/interview/transcript', {
//         sessionId,
//         transcript: transcript + ' ' + userText,
//         lastUserMessage: userText
//       });

//       console.log('✅ Gemini response received:', res.data);

//       if (res.data.success && res.data.aiResponse) {
//         const aiMessage = {
//           id: Date.now() + Math.random(),
//           text: res.data.aiResponse,
//           sender: 'ai',
//           timestamp: new Date().toLocaleTimeString('en-US', { 
//             hour12: false, 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit' 
//           })
//         };
        
//         setMessages(prev => [...prev, aiMessage]);
//         console.log('💬 AI message added to chat');
//       } else {
//         console.log('⚠️ No AI response in data');
//         throw new Error('No AI response received');
//       }
//     } catch (err) {
//       console.error('❌ Gemini API Error:', err);
//       console.error('Error details:', err.response?.data);
      
//       // Show error message in chat
//       const errorMessage = {
//         id: Date.now() + Math.random(),
//         text: '❌ Error: ' + (err.response?.data?.message || err.message || 'Failed to get AI response'),
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       isProcessingRef.current = false;
//       setIsProcessing(false);
//     }
//   };

//   const handleStartRecording = async () => {
//     try {
//       if (!sessionId) {
//         alert('❌ No session ID found. Please go back and start again.');
//         return;
//       }

//       console.log('🎥 Starting screen recording...');
//       const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
//         video: true, 
//         audio: true 
//       });
//       setMediaStream(displayStream);
//       setIsRecording(true);

//       console.log('🎤 Requesting microphone access...');
//       const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
//       if (SpeechRecognition) {
//         const recognitionInstance = new SpeechRecognition();
//         recognitionInstance.continuous = true;
//         recognitionInstance.interimResults = true;
//         recognitionInstance.lang = 'en-US';
//         recognitionInstance.maxAlternatives = 1;

//         recognitionInstance.onresult = (event) => {
//           // If muted, ignore all speech recognition results
//           if (isMuted) {
//             console.log('🔇 Muted - Ignoring speech input');
//             return;
//           }

//           let interimTranscript = '';
//           let finalTranscript = '';

//           for (let i = event.resultIndex; i < event.results.length; i++) {
//             const transcriptPiece = event.results[i][0].transcript;

//             if (event.results[i].isFinal) {
//               finalTranscript += transcriptPiece + ' ';
              
//               console.log('🎙️ Final transcript:', transcriptPiece.trim());

//               const trimmedText = transcriptPiece.trim();
              
//               // Add user message immediately
//               const newMessage = {
//                 id: Date.now() + Math.random(),
//                 text: trimmedText,
//                 sender: 'user',
//                 timestamp: new Date().toLocaleTimeString('en-US', { 
//                   hour12: false, 
//                   hour: '2-digit', 
//                   minute: '2-digit', 
//                   second: '2-digit' 
//                 })
//               };
              
//               setMessages(prev => {
//                 const filtered = prev.filter(msg => !msg.isInterim);
//                 return [...filtered, newMessage];
//               });

//               // Update transcript
//               setTranscript(prev => prev + ' ' + trimmedText);

//               // AUTO SEND TO GEMINI - Check if it's not a duplicate
//               if (trimmedText && trimmedText !== lastProcessedTranscript.current) {
//                 lastProcessedTranscript.current = trimmedText;
//                 console.log('🤖 Queueing Gemini API call...');
                
//                 // Add to queue and process
//                 processingQueue.current.push(trimmedText);
//                 processQueue();
//               }

//             } else {
//               // Show interim results
//               interimTranscript += transcriptPiece;
//               if (interimTranscript.trim()) {
//                 setMessages(prev => {
//                   const filtered = prev.filter(msg => !msg.isInterim);
//                   return [...filtered, {
//                     id: 'interim-' + Date.now(),
//                     text: interimTranscript.trim() + '...',
//                     sender: 'user',
//                     timestamp: new Date().toLocaleTimeString('en-US', { 
//                       hour12: false, 
//                       hour: '2-digit', 
//                       minute: '2-digit', 
//                       second: '2-digit' 
//                     }),
//                     isInterim: true
//                   }];
//                 });
//               }
//             }
//           }
//         };

//         recognitionInstance.onerror = (e) => {
//           console.error('❌ Speech recognition error:', e.error);
//           if (e.error === 'no-speech') {
//             console.log('⏸️ No speech detected, continuing...');
//           } else if (e.error === 'aborted') {
//             console.log('⏹️ Recognition aborted');
//           } else {
//             // Show error in chat
//             const errorMsg = {
//               id: Date.now(),
//               text: `⚠️ Speech recognition error: ${e.error}`,
//               sender: 'ai',
//               timestamp: new Date().toLocaleTimeString('en-US', { 
//                 hour12: false, 
//                 hour: '2-digit', 
//                 minute: '2-digit' 
//               })
//             };
//             setMessages(prev => [...prev, errorMsg]);
//           }
//         };
        
//         recognitionInstance.onend = () => { 
//           if (isRecording) {
//             console.log('🔄 Recognition ended, restarting...');
//             try {
//               recognitionInstance.start();
//             } catch (e) {
//               console.error('Error restarting recognition:', e);
//             }
//           }
//         };
        
//         recognitionInstance.start();
//         console.log('✅ Speech recognition started successfully');
//         setRecognition(recognitionInstance);
        
//         // Stop the mic stream immediately after starting recognition
//         // We only needed it to get permission, recognition uses its own audio
//         micStream.getTracks().forEach(t => t.stop());
        
//       } else {
//         alert('❌ Speech recognition not supported. Please use Chrome or Edge browser.');
//       }
//     } catch (error) {
//       console.error('❌ Recording error:', error);
//       alert('Error starting recording: ' + error.message);
//     }
//   };

//   const handleStopRecording = () => {
//     console.log('⏹️ Stopping recording...');
//     if (recognition) { 
//       recognition.stop(); 
//       setRecognition(null); 
//     }
//     if (mediaStream) { 
//       mediaStream.getTracks().forEach(t => t.stop()); 
//       setMediaStream(null); 
//     }
//     setIsRecording(false);
//     setIsMuted(false);
//     console.log('✅ Recording stopped');
//   };

//   const handleToggleMute = () => {
//     if (!isRecording) {
//       console.log('⚠️ Cannot toggle mute - not recording');
//       return;
//     }
    
//     setIsMuted(prev => {
//       const newMutedState = !prev;
//       console.log(newMutedState ? '🔇 Microphone muted - Speech recognition disabled' : '🔊 Microphone unmuted - Speech recognition enabled');
      
//       // Show mute status message in chat
//       const statusMessage = {
//         id: Date.now(),
//         text: newMutedState 
//           ? '🔇 You are now muted. Your speech will not be processed.' 
//           : '🔊 You are now unmuted. Your speech will be processed.',
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, statusMessage]);
      
//       return newMutedState;
//     });
//   };

//   const handleSendMessage = () => {
//     if (inputMessage.trim()) {
//       const trimmedMessage = inputMessage.trim();
      
//       const newMessage = {
//         id: Date.now(),
//         text: trimmedMessage,
//         sender: 'user',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, newMessage]);
//       setInputMessage('');
      
//       // Send manual message to Gemini
//       processingQueue.current.push(trimmedMessage);
//       processQueue();
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white">
//       <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <h1 className="text-cyan-400 text-xl font-semibold">AI Interview Assistant</h1>
//           <div className="flex items-center gap-4 text-sm text-gray-400">
//             <span className="flex items-center gap-2">
//               <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
//               {sessionId ? 'Connected' : 'Not Connected'}
//             </span>
//             <span className="flex items-center gap-2">
//               <span className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></span>
//               {isProcessing ? 'Processing...' : 'Ready'}
//             </span>
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//           <button 
//             onClick={handleToggleMute} 
//             disabled={!isRecording}
//             className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} ${!isRecording ? 'opacity-50 cursor-not-allowed' : ''} text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
//           >
//             {isMuted ? (
//               <>
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
//                 </svg>
//                 Muted
//               </>
//             ) : (
//               <>
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                 </svg>
//                 Unmuted
//               </>
//             )}
//           </button>
          
//           {isRecording ? (
//             <button onClick={handleStopRecording} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
//               <span className="w-3 h-3 bg-white rounded-sm"></span>Stop Recording
//             </button>
//           ) : (
//             <button onClick={handleStartRecording} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
//               <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>Start Recording
//             </button>
//           )}
          
//           <button onClick={() => {}} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
//             Analysis Screen
//           </button>
//         </div>
//       </div>

//       <div className="flex h-[calc(100vh-80px)]">
//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 overflow-y-auto p-6 space-y-6">
//             {messages.map((message) => (
//               <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                 <div className={`max-w-3xl ${message.sender === 'user' ? 'w-auto' : 'w-full'}`}>
//                   <div className="flex items-start gap-3 mb-2">
//                     <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${message.sender === 'ai' ? 'bg-cyan-500' : 'bg-gray-700'}`}>
//                       {message.sender === 'ai' ? '🤖' : '👤'}
//                     </div>
//                     <div className="flex-1">
//                       <div className={`${message.sender === 'ai' ? 'bg-gray-800' : 'bg-gray-700'} ${message.isInterim ? 'opacity-70 italic' : ''} rounded-lg p-4`}>
//                         <p className="text-gray-200 whitespace-pre-line">{message.text}</p>
//                       </div>
//                       <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
//                         <span>{message.timestamp}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {isProcessing && (
//               <div className="flex items-center gap-2 text-yellow-500">
//                 <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
//                 <span className="text-sm">AI is thinking...</span>
//               </div>
//             )}
//             {isRecording && !isMuted && (
//               <div className="flex items-center gap-2 text-cyan-500">
//                 <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
//                 <span className="text-sm">🎙️ Live Recording - Speak now and AI will respond automatically</span>
//               </div>
//             )}
//             {isRecording && isMuted && (
//               <div className="flex items-center gap-2 text-red-500">
//                 <span className="w-3 h-3 bg-red-500 rounded-full"></span>
//                 <span className="text-sm">🔇 Muted - Your speech is not being processed</span>
//               </div>
//             )}
//           </div>

//           <div className="border-t border-gray-700 p-4">
//             <div className="relative">
//               <textarea 
//                 value={inputMessage} 
//                 onChange={(e) => setInputMessage(e.target.value)} 
//                 onKeyPress={handleKeyPress} 
//                 placeholder="Type your message..." 
//                 className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" 
//                 rows="3" 
//               />
//               <button 
//                 onClick={handleSendMessage} 
//                 className="absolute right-2 bottom-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//               >
//                 Send
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
//           {isRecording && mediaStream && (
//             <div className="p-4 border-b border-gray-700">
//               <h3 className="text-sm font-semibold text-white mb-2">Screen Share Preview</h3>
//               <div className="bg-black rounded-lg overflow-hidden" style={{ height: '200px' }}>
//                 <video 
//                   autoPlay 
//                   muted 
//                   playsInline 
//                   className="w-full h-full object-contain" 
//                   ref={(video) => { if (video) video.srcObject = mediaStream; }} 
//                 />
//               </div>
//             </div>
//           )}
//           <div className="p-4 flex-1">
//             <div className="bg-gray-700 rounded-lg p-4 mb-4">
//               <h3 className="text-sm font-semibold text-white mb-2">Status</h3>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                   <span className="text-gray-300">{sessionId ? '✅ AI Connected' : '❌ Not Connected'}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
//                   <span className="text-gray-300">{isRecording ? '🎙️ Recording' : 'Not Recording'}</span>
//                 </div>
//                 {isRecording && (
//                   <div className="flex items-center gap-2">
//                     <span className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></span>
//                     <span className="text-gray-300">{isMuted ? '🔇 Mic Muted' : '🔊 Mic Active'}</span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></span>
//                   <span className="text-gray-300">{isProcessing ? '⏳ Processing...' : 'Ready'}</span>
//                 </div>
//               </div>
//             </div>
            
//             {sessionId && (
//               <div className="bg-green-900 rounded-lg p-3">
//                 <p className="text-xs text-green-300">✅ Session Active</p>
//                 <p className="text-xs text-gray-400 mt-1">ID: {sessionId.slice(-12)}</p>
//               </div>
//             )}

//             {isRecording && (
//               <div className="mt-4 p-3 bg-cyan-900 rounded-lg">
//                 <p className="text-xs text-cyan-300">
//                   💡 Tip: {isMuted 
//                     ? 'You are muted. Your speech will NOT be processed by the AI. Only screen share audio (interviewer) will be heard!' 
//                     : 'Click "Mute" button to mute yourself when you need to speak privately. The AI will only process the interviewer\'s questions from screen share!'}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Interview;


// // client/src/Components/Interview.jsx - ENHANCED VERSION
// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation } from 'react-router-dom';
// import api from '../api/api';

// const Interview = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [transcript, setTranscript] = useState('');
//   const [mediaStream, setMediaStream] = useState(null);
//   const [recognition, setRecognition] = useState(null);
//   const [sessionId, setSessionId] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isAnalyzing, setIsAnalyzing] = useState(false); // NEW: Screen analysis state

//   const lastProcessedTranscript = useRef('');
//   const processingQueue = useRef([]);
//   const isProcessingRef = useRef(false);
//   const location = useLocation();
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     if (location.state?.sessionId) {
//       setSessionId(location.state.sessionId);
//       console.log('✅ Session ID loaded:', location.state.sessionId);
      
//       const greetingMessage = {
//         id: Date.now(),
//         text: `👋 Hi! I'm your AI interview assistant. I have THREE modes to help you:

// 1. 🎙️ **Voice Mode**: Start recording and I'll answer questions automatically
// 2. ⌨️ **Text Mode**: Type questions manually below
// 3. 🖥️ **Screen Analysis**: Click "Analysis Screen" to instantly analyze coding problems, technical questions, or anything visible on your screen!

// Ready to ace this interview? Let's go! 🚀`,
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages([greetingMessage]);
//     } else {
//       console.error('❌ No session ID found!');
//       alert('❌ Session error. Please go back and start again.');
//     }
//   }, [location]);

//   // Process queue one at a time
//   const processQueue = async () => {
//     if (isProcessingRef.current || processingQueue.current.length === 0) {
//       return;
//     }

//     const userText = processingQueue.current.shift();
//     await sendToGemini(userText);
    
//     if (processingQueue.current.length > 0) {
//       setTimeout(processQueue, 500);
//     }
//   };

//   const sendToGemini = async (userText) => {
//     if (!sessionId || !userText?.trim()) return;

//     isProcessingRef.current = true;
//     setIsProcessing(true);

//     try {
//       console.log('📤 Sending to Gemini:', userText);
      
//       const res = await api.post('/interview/transcript', {
//         sessionId,
//         transcript: transcript + ' ' + userText,
//         lastUserMessage: userText
//       });

//       if (res.data.success && res.data.aiResponse) {
//         const aiMessage = {
//           id: Date.now() + Math.random(),
//           text: res.data.aiResponse,
//           sender: 'ai',
//           timestamp: new Date().toLocaleTimeString('en-US', { 
//             hour12: false, 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit' 
//           })
//         };
        
//         setMessages(prev => [...prev, aiMessage]);
//         console.log('💬 AI message added');
//       }
//     } catch (err) {
//       console.error('❌ Error:', err);
      
//       const errorMessage = {
//         id: Date.now() + Math.random(),
//         text: '❌ Error: ' + (err.response?.data?.message || err.message),
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       isProcessingRef.current = false;
//       setIsProcessing(false);
//     }
//   };

//   // 🚀 NEW: Screen Analysis Function
//   const handleAnalyzeScreen = async () => {
//     if (!sessionId) {
//       alert('❌ No session active. Please restart the interview.');
//       return;
//     }

//     try {
//       setIsAnalyzing(true);

//       // Show starting message
//       const startMessage = {
//         id: Date.now(),
//         text: '🖥️ Analyzing screen content... Please wait...',
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, startMessage]);

//       // Prompt user to paste screen content
//       const screenContent = prompt(
//         '📋 SCREEN ANALYSIS MODE\n\n' +
//         'Paste the coding question, technical problem, or any interview content you want me to analyze:\n\n' +
//         '(Copy from LeetCode, HackerRank, your IDE, or any interview platform)'
//       );

//       if (!screenContent || screenContent.trim() === '') {
//         const cancelMessage = {
//           id: Date.now() + 1,
//           text: '⏭️ Screen analysis cancelled. No content provided.',
//           sender: 'ai',
//           timestamp: new Date().toLocaleTimeString('en-US', { 
//             hour12: false, 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit' 
//           })
//         };
//         setMessages(prev => [...prev, cancelMessage]);
//         setIsAnalyzing(false);
//         return;
//       }

//       console.log('🖥️ Analyzing screen content...');
//       console.log('Content length:', screenContent.length);

//       // Call screen analysis API
//       const res = await api.post('/interview/analyze-screen', {
//         sessionId,
//         screenContent,
//         analysisType: 'auto' // Auto-detect type
//       });

//       console.log('✅ Screen analysis response received');

//       if (res.data.success && res.data.aiAnalysis) {
//         // Remove "analyzing..." message
//         setMessages(prev => prev.filter(msg => msg.text !== startMessage.text));

//         // Add analysis result
//         const analysisMessage = {
//           id: Date.now() + 2,
//           text: `🖥️ **SCREEN ANALYSIS COMPLETE**\n\n${res.data.aiAnalysis}`,
//           sender: 'ai',
//           timestamp: new Date().toLocaleTimeString('en-US', { 
//             hour12: false, 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit' 
//           }),
//           isAnalysis: true
//         };
        
//         setMessages(prev => [...prev, analysisMessage]);

//         // Success notification
//         const successNotif = {
//           id: Date.now() + 3,
//           text: '✅ Analysis complete! You can now use this solution in your interview. Click "Analysis Screen" again anytime to analyze more content.',
//           sender: 'ai',
//           timestamp: new Date().toLocaleTimeString('en-US', { 
//             hour12: false, 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit' 
//           })
//         };
//         setMessages(prev => [...prev, successNotif]);
//       }

//     } catch (err) {
//       console.error('❌ Screen analysis error:', err);
      
//       const errorMessage = {
//         id: Date.now() + 4,
//         text: `❌ Screen analysis failed: ${err.response?.data?.message || err.message}\n\nPlease try again or check your connection.`,
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const handleStartRecording = async () => {
//     try {
//       if (!sessionId) {
//         alert('❌ No session ID found. Please go back and start again.');
//         return;
//       }

//       console.log('🎥 Starting screen recording...');
//       const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
//         video: true, 
//         audio: true 
//       });
//       setMediaStream(displayStream);
//       setIsRecording(true);

//       console.log('🎤 Requesting microphone access...');
//       const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
//       if (SpeechRecognition) {
//         const recognitionInstance = new SpeechRecognition();
//         recognitionInstance.continuous = true;
//         recognitionInstance.interimResults = true;
//         recognitionInstance.lang = 'en-US';

//         recognitionInstance.onresult = (event) => {
//           if (isMuted) {
//             console.log('🔇 Muted - Ignoring speech');
//             return;
//           }

//           let interimTranscript = '';
//           let finalTranscript = '';

//           for (let i = event.resultIndex; i < event.results.length; i++) {
//             const transcriptPiece = event.results[i][0].transcript;

//             if (event.results[i].isFinal) {
//               finalTranscript += transcriptPiece + ' ';
              
//               const trimmedText = transcriptPiece.trim();
              
//               const newMessage = {
//                 id: Date.now() + Math.random(),
//                 text: trimmedText,
//                 sender: 'user',
//                 timestamp: new Date().toLocaleTimeString('en-US', { 
//                   hour12: false, 
//                   hour: '2-digit', 
//                   minute: '2-digit', 
//                   second: '2-digit' 
//                 })
//               };
              
//               setMessages(prev => {
//                 const filtered = prev.filter(msg => !msg.isInterim);
//                 return [...filtered, newMessage];
//               });

//               setTranscript(prev => prev + ' ' + trimmedText);

//               if (trimmedText && trimmedText !== lastProcessedTranscript.current) {
//                 lastProcessedTranscript.current = trimmedText;
//                 processingQueue.current.push(trimmedText);
//                 processQueue();
//               }

//             } else {
//               interimTranscript += transcriptPiece;
//               if (interimTranscript.trim()) {
//                 setMessages(prev => {
//                   const filtered = prev.filter(msg => !msg.isInterim);
//                   return [...filtered, {
//                     id: 'interim-' + Date.now(),
//                     text: interimTranscript.trim() + '...',
//                     sender: 'user',
//                     timestamp: new Date().toLocaleTimeString('en-US', { 
//                       hour12: false, 
//                       hour: '2-digit', 
//                       minute: '2-digit', 
//                       second: '2-digit' 
//                     }),
//                     isInterim: true
//                   }];
//                 });
//               }
//             }
//           }
//         };

//         recognitionInstance.onerror = (e) => {
//           console.error('❌ Speech recognition error:', e.error);
//         };
        
//         recognitionInstance.onend = () => { 
//           if (isRecording) {
//             try {
//               recognitionInstance.start();
//             } catch (e) {
//               console.error('Error restarting recognition:', e);
//             }
//           }
//         };
        
//         recognitionInstance.start();
//         setRecognition(recognitionInstance);
//         micStream.getTracks().forEach(t => t.stop());
        
//       } else {
//         alert('❌ Speech recognition not supported. Please use Chrome or Edge.');
//       }
//     } catch (error) {
//       console.error('❌ Recording error:', error);
//       alert('Error starting recording: ' + error.message);
//     }
//   };

//   const handleStopRecording = () => {
//     if (recognition) { 
//       recognition.stop(); 
//       setRecognition(null); 
//     }
//     if (mediaStream) { 
//       mediaStream.getTracks().forEach(t => t.stop()); 
//       setMediaStream(null); 
//     }
//     setIsRecording(false);
//     setIsMuted(false);
//   };

//   const handleToggleMute = () => {
//     if (!isRecording) return;
    
//     setIsMuted(prev => {
//       const newMutedState = !prev;
      
//       const statusMessage = {
//         id: Date.now(),
//         text: newMutedState 
//           ? '🔇 You are now muted. Speech recognition paused.' 
//           : '🔊 You are now unmuted. Speech recognition active.',
//         sender: 'ai',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit', 
//           second: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, statusMessage]);
      
//       return newMutedState;
//     });
//   };

//   const handleSendMessage = () => {
//     if (inputMessage.trim()) {
//       const trimmedMessage = inputMessage.trim();
      
//       const newMessage = {
//         id: Date.now(),
//         text: trimmedMessage,
//         sender: 'user',
//         timestamp: new Date().toLocaleTimeString('en-US', { 
//           hour12: false, 
//           hour: '2-digit', 
//           minute: '2-digit' 
//         })
//       };
//       setMessages(prev => [...prev, newMessage]);
//       setInputMessage('');
      
//       processingQueue.current.push(trimmedMessage);
//       processQueue();
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white">
//       {/* Header */}
//       <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <h1 className="text-cyan-400 text-xl font-semibold">🤖 AI Interview Assistant</h1>
//           <div className="flex items-center gap-4 text-sm text-gray-400">
//             <span className="flex items-center gap-2">
//               <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
//               {sessionId ? 'Connected' : 'Not Connected'}
//             </span>
//             <span className="flex items-center gap-2">
//               <span className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></span>
//               {isProcessing ? 'Processing...' : 'Ready'}
//             </span>
//           </div>
//         </div>
        
//         {/* Action Buttons */}
//         <div className="flex items-center gap-3">
//           {/* Mute Button */}
//           <button 
//             onClick={handleToggleMute} 
//             disabled={!isRecording}
//             className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} ${!isRecording ? 'opacity-50 cursor-not-allowed' : ''} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
//             title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
//           >
//             {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
//           </button>
          
//           {/* Recording Button */}
//           {isRecording ? (
//             <button 
//               onClick={handleStopRecording} 
//               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
//             >
//               <span className="w-3 h-3 bg-white rounded-sm"></span>
//               Stop Recording
//             </button>
//           ) : (
//             <button 
//               onClick={handleStartRecording} 
//               className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
//             >
//               <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
//               Start Recording
//             </button>
//           )}
          
//           {/* 🚀 NEW: Analysis Screen Button */}
//           <button 
//             onClick={handleAnalyzeScreen}
//             disabled={isAnalyzing}
//             className={`${isAnalyzing ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isAnalyzing ? 'opacity-75 cursor-wait' : ''}`}
//             title="Analyze coding questions or technical content from your screen"
//           >
//             {isAnalyzing ? (
//               <>
//                 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
//                 Analyzing...
//               </>
//             ) : (
//               <>
//                 🖥️ Analysis Screen
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex h-[calc(100vh-80px)]">
//         {/* Chat Area */}
//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 overflow-y-auto p-6 space-y-6">
//             {messages.map((message) => (
//               <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                 <div className={`max-w-3xl ${message.sender === 'user' ? 'w-auto' : 'w-full'}`}>
//                   <div className="flex items-start gap-3 mb-2">
//                     <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${message.sender === 'ai' ? (message.isAnalysis ? 'bg-purple-600' : 'bg-cyan-500') : 'bg-gray-700'}`}>
//                       {message.sender === 'ai' ? (message.isAnalysis ? '🖥️' : '🤖') : '👤'}
//                     </div>
//                     <div className="flex-1">
//                       <div className={`${message.sender === 'ai' ? (message.isAnalysis ? 'bg-purple-900 border border-purple-500' : 'bg-gray-800') : 'bg-gray-700'} ${message.isInterim ? 'opacity-70 italic' : ''} rounded-lg p-4`}>
//                         <p className="text-gray-200 whitespace-pre-line">{message.text}</p>
//                       </div>
//                       <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
//                         <span>{message.timestamp}</span>
//                         {message.isAnalysis && <span className="text-purple-400">• Screen Analysis</span>}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
            
//             {/* Status Indicators */}
//             {isProcessing && (
//               <div className="flex items-center gap-2 text-yellow-500">
//                 <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
//                 <span className="text-sm">AI is thinking...</span>
//               </div>
//             )}
            
//             {isRecording && !isMuted && (
//               <div className="flex items-center gap-2 text-cyan-500">
//                 <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
//                 <span className="text-sm">🎙️ Live Recording - Speak now</span>
//               </div>
//             )}
            
//             {isRecording && isMuted && (
//               <div className="flex items-center gap-2 text-red-500">
//                 <span className="w-3 h-3 bg-red-500 rounded-full"></span>
//                 <span className="text-sm">🔇 Muted</span>
//               </div>
//             )}
            
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input Area */}
//           <div className="border-t border-gray-700 p-4">
//             <div className="relative">
//               <textarea 
//                 value={inputMessage} 
//                 onChange={(e) => setInputMessage(e.target.value)} 
//                 onKeyPress={handleKeyPress} 
//                 placeholder="Type your message or question..." 
//                 className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" 
//                 rows="3" 
//               />
//               <button 
//                 onClick={handleSendMessage} 
//                 className="absolute right-2 bottom-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//               >
//                 Send
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
//           {isRecording && mediaStream && (
//             <div className="p-4 border-b border-gray-700">
//               <h3 className="text-sm font-semibold text-white mb-2">Screen Share Preview</h3>
//               <div className="bg-black rounded-lg overflow-hidden" style={{ height: '200px' }}>
//                 <video 
//                   autoPlay 
//                   muted 
//                   playsInline 
//                   className="w-full h-full object-contain" 
//                   ref={(video) => { if (video) video.srcObject = mediaStream; }} 
//                 />
//               </div>
//             </div>
//           )}
          
//           <div className="p-4 flex-1">
//             {/* Status Panel */}
//             <div className="bg-gray-700 rounded-lg p-4 mb-4">
//               <h3 className="text-sm font-semibold text-white mb-2">Status</h3>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                   <span className="text-gray-300">{sessionId ? '✅ AI Connected' : '❌ Not Connected'}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
//                   <span className="text-gray-300">{isRecording ? '🎙️ Recording' : 'Not Recording'}</span>
//                 </div>
//                 {isRecording && (
//                   <div className="flex items-center gap-2">
//                     <span className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></span>
//                     <span className="text-gray-300">{isMuted ? '🔇 Muted' : '🔊 Active'}</span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2">
//                   <span className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'}`}></span>
//                   <span className="text-gray-300">{isAnalyzing ? '🖥️ Analyzing...' : 'Screen Analysis Ready'}</span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Session Info */}
//             {sessionId && (
//               <div className="bg-green-900 rounded-lg p-3 mb-4">
//                 <p className="text-xs text-green-300">✅ Session Active</p>
//                 <p className="text-xs text-gray-400 mt-1">ID: {sessionId.slice(-12)}</p>
//               </div>
//             )}

//             {/* Help Tips */}
//             <div className="bg-cyan-900 rounded-lg p-3">
//               <h3 className="text-xs font-semibold text-cyan-300 mb-2">💡 Quick Tips</h3>
//               <ul className="text-xs text-cyan-200 space-y-1">
//                 <li>• Use 🎙️ Voice for real-time Q&A</li>
//                 <li>• Use ⌨️ Text for specific questions</li>
//                 <li>• Use 🖥️ Analysis for coding problems</li>
//                 <li>• Mute yourself when needed</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Interview;

// client/src/Components/Interview.jsx - COMPLETE FILE WITH PASTE FEATURE
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';
import Tesseract from 'tesseract.js';

const Interview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [showCaptureArea, setShowCaptureArea] = useState(false);
  const [captureMode, setCaptureMode] = useState('full');
  const [selectionArea, setSelectionArea] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);

  const lastProcessedTranscript = useRef('');
  const processingQueue = useRef([]);
  const isProcessingRef = useRef(false);
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selectionCanvasRef = useRef(null);

  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      console.log('✅ Session ID loaded:', location.state.sessionId);
      
      const greetingMessage = {
        id: Date.now(),
        text: `👋 Hi! I'm your AI interview assistant with ADVANCED features:

1. 🎙️ **Voice Mode**: Start recording and I'll answer questions automatically
2. ⌨️ **Text Mode**: Type or PASTE coding questions and get instant solutions
3. 🖥️ **Smart Screen Analysis**: 
   - Click "Analysis Screen" to capture what's on your shared screen
   - Choose FULL screen capture or SELECT a specific area
   - AI will read and solve coding problems, technical questions, diagrams, etc.
   - Works with LeetCode, HackerRank, CoderPad, IDEs, interview platforms

💡 **NEW: Paste any coding question** into the text box below and get complete working solutions instantly!

Ready to ace this interview? Start recording and share your screen! 🚀`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages([greetingMessage]);
    } else {
      console.error('❌ No session ID found!');
      alert('❌ Session error. Please go back and start again.');
    }
  }, [location]);

  const processQueue = async () => {
    if (isProcessingRef.current || processingQueue.current.length === 0) {
      return;
    }

    const userText = processingQueue.current.shift();
    await sendToGemini(userText);
    
    if (processingQueue.current.length > 0) {
      setTimeout(processQueue, 500);
    }
  };

  const sendToGemini = async (userText) => {
    if (!sessionId || !userText?.trim()) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      console.log('📤 Sending to Gemini:', userText);
      
      const res = await api.post('/interview/transcript', {
        sessionId,
        transcript: transcript + ' ' + userText,
        lastUserMessage: userText
      });

      if (res.data.success && res.data.aiResponse) {
        const aiMessage = {
          id: Date.now() + Math.random(),
          text: res.data.aiResponse,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      
      const errorMessage = {
        id: Date.now() + Math.random(),
        text: '❌ Error: ' + (err.response?.data?.message || err.message),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  // 🚀 NEW: Handle pasted coding questions
  const handlePastedQuestion = async (pastedContent) => {
    if (!sessionId) return;
    
    setIsProcessing(true);
    
    try {
      console.log('📋 Processing pasted question...');
      
      const processingMsg = {
        id: Date.now(),
        text: '🔄 Analyzing your question and generating complete solution...',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, processingMsg]);
      
      const res = await api.post('/interview/paste-question', {
        sessionId,
        pastedContent
      });

      if (res.data.success && res.data.aiResponse) {
        setMessages(prev => prev.filter(msg => msg.text !== processingMsg.text));
        
        const aiMessage = {
          id: Date.now() + Math.random(),
          text: res.data.aiResponse,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          isPastedSolution: true,
          questionType: res.data.questionType
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      
      const errorMessage = {
        id: Date.now() + Math.random(),
        text: '❌ Error: ' + (err.response?.data?.message || err.message),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const captureScreenFromVideo = async (captureArea = null) => {
    try {
      if (!videoRef.current || !mediaStream) {
        alert('❌ Please start screen recording first!');
        return null;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (captureArea) {
        canvas.width = captureArea.width;
        canvas.height = captureArea.height;
        ctx.drawImage(
          video,
          captureArea.x,
          captureArea.y,
          captureArea.width,
          captureArea.height,
          0,
          0,
          captureArea.width,
          captureArea.height
        );
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }

      const imageDataUrl = canvas.toDataURL('image/png');
      console.log('📸 Screen captured successfully');
      return imageDataUrl;

    } catch (error) {
      console.error('❌ Screen capture error:', error);
      throw error;
    }
  };

  const extractTextFromImage = async (imageDataUrl) => {
    try {
      console.log('🔍 Starting OCR text extraction...');
      
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log('✅ OCR Complete. Confidence:', confidence);
      console.log('📝 Extracted text preview:', text.substring(0, 200) + '...');
      
      return text;

    } catch (error) {
      console.error('❌ OCR error:', error);
      throw new Error('Failed to extract text from image: ' + error.message);
    }
  };

  const handleAnalyzeScreen = async () => {
    if (!sessionId) {
      alert('❌ No session active. Please restart the interview.');
      return;
    }

    if (!mediaStream || !isRecording) {
      alert('❌ Please start screen recording first!\n\nClick "Start Recording" and share your screen, then try again.');
      return;
    }

    const useSelectionMode = window.event?.shiftKey;
    
    if (useSelectionMode) {
      setCaptureMode('selection');
      setShowCaptureArea(true);
    } else {
      executeScreenAnalysis('full');
    }
  };

  const executeScreenAnalysis = async (mode) => {
    try {
      setIsAnalyzing(true);
      setShowCaptureArea(false);

      const startMessage = {
        id: Date.now(),
        text: mode === 'selection' 
          ? '🖥️ Analyzing selected area... This may take 10-20 seconds...'
          : '🖥️ Analyzing full screen... This may take 10-20 seconds...',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, startMessage]);

      console.log('📸 Capturing screen...');
      const imageData = await captureScreenFromVideo(
        mode === 'selection' ? selectionArea : null
      );

      if (!imageData) {
        throw new Error('Failed to capture screen');
      }

      console.log('🔍 Extracting text with OCR...');
      const extractedText = await extractTextFromImage(imageData);

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No text detected in the captured area. Please ensure the question is visible and clear.');
      }

      console.log('🤖 Sending to AI for analysis...');
      const res = await api.post('/interview/analyze-screen', {
        sessionId,
        screenContent: extractedText,
        analysisType: 'ocr-capture'
      });

      if (res.data.success && res.data.aiAnalysis) {
        setMessages(prev => prev.filter(msg => msg.text !== startMessage.text));

        const capturedTextMessage = {
          id: Date.now() + 1,
          text: `📝 **Detected Question:**\n\n${extractedText.substring(0, 500)}${extractedText.length > 500 ? '...' : ''}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          isCapture: true
        };
        setMessages(prev => [...prev, capturedTextMessage]);

        const analysisMessage = {
          id: Date.now() + 2,
          text: `🖥️ **SCREEN ANALYSIS COMPLETE**\n\n${res.data.aiAnalysis}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          isAnalysis: true
        };
        
        setMessages(prev => [...prev, analysisMessage]);

        const successNotif = {
          id: Date.now() + 3,
          text: '✅ Analysis complete! You can now use this solution. Click "Analysis Screen" again to analyze more content.',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        };
        setMessages(prev => [...prev, successNotif]);
      }

    } catch (err) {
      console.error('❌ Screen analysis error:', err);
      
      const errorMessage = {
        id: Date.now() + 4,
        text: `❌ Screen analysis failed: ${err.message}\n\nTips:\n• Ensure the question is clearly visible\n• Try selecting a smaller, clearer area\n• Make sure text is not blurry or too small`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
      setSelectionArea(null);
    }
  };

  const handleMouseDown = (e) => {
    if (!showCaptureArea || captureMode !== 'selection') return;
    
    const rect = selectionCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
    setSelectionArea(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;
    
    const rect = selectionCanvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    
    setSelectionArea({ x, y, width, height });
    
    const canvas = selectionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!sessionId) {
        alert('❌ No session ID found. Please go back and start again.');
        return;
      }

      console.log('🎥 Starting screen recording...');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          cursor: 'always',
          displaySurface: 'monitor'
        }, 
        audio: true 
      });
      
      setMediaStream(displayStream);
      setIsRecording(true);

      console.log('🎤 Requesting microphone access...');
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          if (isMuted) return;

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
              
              const trimmedText = transcriptPiece.trim();
              
              const newMessage = {
                id: Date.now() + Math.random(),
                text: trimmedText,
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })
              };
              
              setMessages(prev => {
                const filtered = prev.filter(msg => !msg.isInterim);
                return [...filtered, newMessage];
              });

              setTranscript(prev => prev + ' ' + trimmedText);

              if (trimmedText && trimmedText !== lastProcessedTranscript.current) {
                lastProcessedTranscript.current = trimmedText;
                processingQueue.current.push(trimmedText);
                processQueue();
              }

            } else {
              interimTranscript += transcriptPiece;
              if (interimTranscript.trim()) {
                setMessages(prev => {
                  const filtered = prev.filter(msg => !msg.isInterim);
                  return [...filtered, {
                    id: 'interim-' + Date.now(),
                    text: interimTranscript.trim() + '...',
                    sender: 'user',
                    timestamp: new Date().toLocaleTimeString('en-US', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    }),
                    isInterim: true
                  }];
                });
              }
            }
          }
        };

        recognitionInstance.onerror = (e) => {
          console.error('❌ Speech recognition error:', e.error);
        };
        
        recognitionInstance.onend = () => { 
          if (isRecording) {
            try {
              recognitionInstance.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }
        };
        
        recognitionInstance.start();
        setRecognition(recognitionInstance);
        micStream.getTracks().forEach(t => t.stop());
        
        const recordingStartMessage = {
          id: Date.now(),
          text: '✅ Screen recording started! You can now:\n• Speak naturally for voice Q&A\n• Click "Analysis Screen" anytime to analyze coding problems\n• Paste coding questions in the text box below\n• Mute yourself when needed',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        };
        setMessages(prev => [...prev, recordingStartMessage]);
        
      } else {
        alert('❌ Speech recognition not supported. Please use Chrome or Edge.');
      }
    } catch (error) {
      console.error('❌ Recording error:', error);
      alert('Error starting recording: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    if (recognition) { 
      recognition.stop(); 
      setRecognition(null); 
    }
    if (mediaStream) { 
      mediaStream.getTracks().forEach(t => t.stop()); 
      setMediaStream(null); 
    }
    setIsRecording(false);
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (!isRecording) return;
    
    setIsMuted(prev => {
      const newMutedState = !prev;
      
      const statusMessage = {
        id: Date.now(),
        text: newMutedState 
          ? '🔇 You are now muted. Speech recognition paused.' 
          : '🔊 You are now unmuted. Speech recognition active.',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
      setMessages(prev => [...prev, statusMessage]);
      
      return newMutedState;
    });
  };

  // 🚀 UPDATED: Smart message handler with paste detection
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const trimmedMessage = inputMessage.trim();
      
      // Check if it looks like a pasted coding question
      const isPastedQuestion = 
        trimmedMessage.length > 100 || 
        trimmedMessage.includes('\n') ||
        trimmedMessage.includes('Example:') ||
        trimmedMessage.includes('Input:') ||
        trimmedMessage.includes('Output:') ||
        trimmedMessage.includes('Constraints:') ||
        trimmedMessage.toLowerCase().includes('function') ||
        trimmedMessage.toLowerCase().includes('return') ||
        trimmedMessage.toLowerCase().includes('given') ||
        trimmedMessage.toLowerCase().includes('array');
      
      const newMessage = {
        id: Date.now(),
        text: trimmedMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      
      // Use different endpoint for pasted questions
      if (isPastedQuestion) {
        console.log('📋 Detected pasted coding question');
        handlePastedQuestion(trimmedMessage);
      } else {
        processingQueue.current.push(trimmedMessage);
        processQueue();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-cyan-400 text-xl font-semibold">🤖 AI Interview Assistant</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {sessionId ? 'Connected' : 'Not Connected'}
            </span>
            <span className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></span>
              {isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleMute} 
            disabled={!isRecording}
            className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} ${!isRecording ? 'opacity-50 cursor-not-allowed' : ''} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
          >
            {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
          </button>
          
          {isRecording ? (
            <button 
              onClick={handleStopRecording} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span className="w-3 h-3 bg-white rounded-sm"></span>
              Stop Recording
            </button>
          ) : (
            <button 
              onClick={handleStartRecording} 
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Start Recording
            </button>
          )}
          
          <button 
            onClick={handleAnalyzeScreen}
            disabled={isAnalyzing || !isRecording}
            className={`${isAnalyzing ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} ${!isRecording ? 'opacity-50 cursor-not-allowed' : ''} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
            title="Click to analyze full screen | Hold SHIFT + Click for selection mode"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Analyzing...
              </>
            ) : (
              <>
                🖥️ Analysis Screen
              </>
            )}
          </button>
        </div>
      </div>

      {captureMode === 'selection' && showCaptureArea && (
        <div className="fixed inset-0 z-50">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white px-6 py-3 rounded-lg shadow-2xl">
            🎨 Draw a rectangle around the question, then click "Capture"
          </div>
          
          <canvas
            ref={selectionCanvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          />
          
          {selectionArea && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-4 shadow-2xl flex gap-4">
              <button
                onClick={() => executeScreenAnalysis('selection')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ✅ Capture This Area
              </button>
              <button
                onClick={() => {
                  setSelectionArea(null);
                  setShowCaptureArea(false);
                  setCaptureMode('full');
                  const ctx = selectionCanvasRef.current?.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, selectionCanvasRef.current.width, selectionCanvasRef.current.height);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.sender === 'user' ? 'w-auto' : 'w-full'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      message.sender === 'ai' 
                        ? (message.isAnalysis ? 'bg-purple-600' : message.isCapture ? 'bg-blue-600' : message.isPastedSolution ? 'bg-green-600' : 'bg-cyan-500')
                        : 'bg-gray-700'
                    }`}>
                      {message.sender === 'ai' 
                        ? (message.isAnalysis ? '🖥️' : message.isCapture ? '📸' : message.isPastedSolution ? '💻' : '🤖')
                        : '👤'
                      }
                    </div>
                    <div className="flex-1">
                      <div className={`${
                        message.sender === 'ai' 
                          ? (message.isAnalysis ? 'bg-purple-900 border border-purple-500' : message.isCapture ? 'bg-blue-900 border border-blue-500' : message.isPastedSolution ? 'bg-green-900 border border-green-500' : 'bg-gray-800')
                          : 'bg-gray-700'
                      } ${message.isInterim ? 'opacity-70 italic' : ''} rounded-lg p-4`}>
                        <div 
                          className="text-gray-200 whitespace-pre-wrap break-words"
                          style={{ 
                            fontFamily: message.isPastedSolution ? 'monospace, monospace' : 'inherit',
                            fontSize: message.isPastedSolution ? '0.9rem' : 'inherit',
                            lineHeight: '1.6'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: message.text
                              .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background:#1a1a1a;padding:1rem;border-radius:0.5rem;overflow-x:auto;margin:0.5rem 0;border:1px solid #374151;"><code style="font-family:monospace;font-size:0.875rem;color:#e5e7eb;">$2</code></pre>')
                              .replace(/`([^`]+)`/g, '<code style="background:#374151;padding:0.2rem 0.4rem;border-radius:0.25rem;font-family:monospace;color:#fbbf24;">$1</code>')
                              .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#60a5fa;font-weight:600;">$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{message.timestamp}</span>
                        {message.isAnalysis && <span className="text-purple-400">• Screen Analysis Result</span>}
                        {message.isCapture && <span className="text-blue-400">• Captured Text</span>}
                        {message.isPastedSolution && <span className="text-green-400">• 💻 Pasted Question Solution</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-yellow-500">
                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-purple-500">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="text-sm">🔍 Analyzing screen... OCR in progress...</span>
              </div>
            )}
            
            {isRecording && !isMuted && (
              <div className="flex items-center gap-2 text-cyan-500">
                <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
                <span className="text-sm">🎙️ Live Recording - Speak now</span>
              </div>
            )}
            
            {isRecording && isMuted && (
              <div className="flex items-center gap-2 text-red-500">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-sm">🔇 Muted</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-700 p-4">
            <div className="relative">
              <textarea 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                onKeyPress={handleKeyPress} 
                placeholder="Type your message or PASTE any coding question here for instant solutions..." 
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                rows="3" 
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isProcessing}
                className={`absolute right-2 bottom-2 ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600'} text-white px-6 py-2 rounded-lg font-medium transition-colors`}
              >
                {isProcessing ? 'Processing...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Paste any LeetCode, HackerRank, or coding question here and press Enter for instant complete solutions!
            </p>
          </div>
        </div>

        <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
          {isRecording && mediaStream && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2">📹 Screen Share Preview</h3>
              <div className="bg-black rounded-lg overflow-hidden relative" style={{ height: '200px' }}>
                <video 
                  ref={(video) => {
                    if (video && mediaStream) {
                      video.srcObject = mediaStream;
                      videoRef.current = video;
                    }
                  }}
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-contain" 
                  onLoadedMetadata={(e) => {
                    console.log('✅ Video stream ready for capture');
                    console.log('Video dimensions:', e.target.videoWidth, 'x', e.target.videoHeight);
                  }}
                />
                {isRecording && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ✅ Ready for screen capture. Click "Analysis Screen" to scan coding questions.
              </p>
            </div>
          )}
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3">📊 System Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-gray-300">{sessionId ? '✅ AI Connected' : '❌ Not Connected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                  <span className="text-gray-300">{isRecording ? '🎙️ Recording Active' : '⏸️ Not Recording'}</span>
                </div>
                {isRecording && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className="text-gray-300">{isMuted ? '🔇 Mic Muted' : '🔊 Mic Active'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-gray-300">📸 Screen Capture Ready</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'}`}></span>
                  <span className="text-gray-300">{isAnalyzing ? '🔍 Analyzing...' : '✅ Ready to Analyze'}</span>
                </div>
              </div>
            </div>
            
            {sessionId && (
              <div className="bg-green-900 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-300 font-semibold">✅ Active Session</p>
                <p className="text-xs text-gray-400 mt-1">ID: {sessionId.slice(-12)}</p>
              </div>
            )}

            <div className="bg-cyan-900 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-cyan-300 mb-3">🎯 How to Use</h3>
              <div className="space-y-3 text-xs text-cyan-200">
                <div className="flex gap-2">
                  <span className="text-lg">🎙️</span>
                  <div>
                    <div className="font-semibold">Voice Mode</div>
                    <div className="text-cyan-300 opacity-80">Start recording and speak naturally. AI responds automatically.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">💻</span>
                  <div>
                    <div className="font-semibold">Paste Questions</div>
                    <div className="text-cyan-300 opacity-80">Copy any coding question and paste in text box. Get instant complete solutions!</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">🖥️</span>
                  <div>
                    <div className="font-semibold">Screen Analysis</div>
                    <div className="text-cyan-300 opacity-80">Click to analyze full screen instantly. Hold SHIFT + Click to select specific area.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">⌨️</span>
                  <div>
                    <div className="font-semibold">Text Mode</div>
                    <div className="text-cyan-300 opacity-80">Type questions manually in the box below.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-green-300 mb-2">💡 Paste Question Features</h3>
              <ul className="text-xs text-green-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Complete working code in your preferred language</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Time & space complexity analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Test cases with expected outputs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Edge cases handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Works with LeetCode, HackerRank, Codeforces, etc.</span>
                </li>
              </ul>
            </div>

            {isRecording && (
              <div className="bg-purple-900 border border-purple-600 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">💡 Screen Analysis Tips</h3>
                <ul className="text-xs text-purple-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Ensure coding question is clearly visible on shared screen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Use "Select Area" for better OCR accuracy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Works with LeetCode, HackerRank, CoderPad, IDE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Analysis takes 10-20 seconds (OCR + AI)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⚠️</span>
                    <span>Avoid blurry or very small text</span>
                  </li>
                </ul>
              </div>
            )}

            {!isRecording && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Notice</h3>
                <p className="text-xs text-yellow-200">
                  Screen Analysis requires active screen recording. Click "Start Recording" and share your screen first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Interview;