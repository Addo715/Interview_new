// client/src/Components/Interview.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

const Interview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const lastProcessedTranscript = useRef('');
  const isProcessingRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      console.log('✅ Session ID loaded:', location.state.sessionId);
    } else {
      console.error('❌ No session ID found!');
    }
  }, [location]);

  const sendToGemini = async (userText) => {
    if (isProcessingRef.current) {
      console.log('⏳ Already processing, skipping...');
      return;
    }

    if (!sessionId) {
      console.error('❌ No sessionId available');
      return;
    }

    isProcessingRef.current = true;

    try {
      console.log('📤 Sending to Gemini:', userText);
      
      const res = await api.post('/interview/transcript', {
        sessionId,
        transcript: transcript + userText,
        lastUserMessage: userText
      });

      console.log('✅ Gemini response received:', res.data);

      if (res.data.aiResponse) {
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
        console.log('💬 AI message added to chat');
      } else {
        console.log('⚠️ No AI response in data');
      }
    } catch (err) {
      console.error('❌ Gemini API Error:', err);
      console.error('Error details:', err.response?.data);
      
      // Show error message in chat
      const errorMessage = {
        id: Date.now() + Math.random(),
        text: '❌ Error getting AI response. Please check console.',
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
        video: true, 
        audio: true 
      });
      setMediaStream(displayStream);
      setIsRecording(true);

      console.log('🎤 Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
              
              console.log('🎙️ Final transcript:', transcriptPiece.trim());

              // Add user message
              const newMessage = {
                id: Date.now(),
                text: transcriptPiece.trim(),
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })
              };
              
              setMessages(prev => {
                // Remove interim messages
                const filtered = prev.filter(msg => !msg.isInterim);
                return [...filtered, newMessage];
              });

              // Update transcript
              setTranscript(prev => prev + transcriptPiece + ' ');

              // AUTO SEND TO GEMINI - This is the key part!
              const trimmedText = transcriptPiece.trim();
              if (trimmedText && trimmedText !== lastProcessedTranscript.current) {
                lastProcessedTranscript.current = trimmedText;
                console.log('🤖 Triggering Gemini API call...');
                sendToGemini(trimmedText);
              }

            } else {
              // Show interim results
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
          if (e.error === 'no-speech') {
            console.log('⏸️ No speech detected, continuing...');
          } else if (e.error === 'aborted') {
            console.log('⏹️ Recognition aborted');
          }
        };
        
        recognitionInstance.onend = () => { 
          if (isRecording) {
            console.log('🔄 Recognition ended, restarting...');
            try {
              recognitionInstance.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }
        };
        
        recognitionInstance.start();
        console.log('✅ Speech recognition started successfully');
        setRecognition(recognitionInstance);
        
      } else {
        alert('❌ Speech recognition not supported. Please use Chrome or Edge browser.');
      }
    } catch (error) {
      console.error('❌ Recording error:', error);
      alert('Error starting recording: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    console.log('⏹️ Stopping recording...');
    if (recognition) { 
      recognition.stop(); 
      setRecognition(null); 
    }
    if (mediaStream) { 
      mediaStream.getTracks().forEach(t => t.stop()); 
      setMediaStream(null); 
    }
    setIsRecording(false);
    console.log('✅ Recording stopped');
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: inputMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
      
      // Also send manual message to Gemini
      sendToGemini(inputMessage.trim());
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
          <h1 className="text-cyan-400 text-xl font-semibold">Frontend @ Amalitech</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-gray-400"></span>4 mins</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-gray-400"></span>Auto</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-gray-400"></span>Memory</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-gray-400"></span>Web Search</span>
            <span className="text-gray-500">Not Connected. Install here</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-gray-400"></span>General</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isRecording ? (
            <button onClick={handleStopRecording} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="w-3 h-3 bg-white rounded-sm"></span>Stop Recording
            </button>
          ) : (
            <button onClick={handleStartRecording} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>Start Recording
            </button>
          )}
          <button className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"><span className="text-2xl">Power</span></button>
          <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"><span className="text-2xl">Gear</span></button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.sender === 'user' ? 'w-auto' : 'w-full'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {message.sender === 'ai' ? 'AI' : 'You'}
                    </div>
                    <div className="flex-1">
                      <div className={`${message.sender === 'ai' ? 'bg-gray-800' : 'bg-gray-700'} ${message.isInterim ? 'opacity-70 italic' : ''} rounded-lg p-4`}>
                        <p className="text-gray-200 whitespace-pre-line">{message.text}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>Clipboard</span><span className="ml-auto">{message.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm">Live Recording - Speak and Gemini will respond automatically</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">Chat</button>
              <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">Microphone</button>
              <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">Document</button>
              <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">Link</button>
            </div>
            <div className="relative">
              <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" rows="3" />
              <button onClick={handleSendMessage} className="absolute right-2 bottom-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">Send</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">0/{inputMessage.length} characters</div>
          </div>
        </div>

        <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
          {isRecording && mediaStream && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2">Screen Share Preview</h3>
              <div className="bg-black rounded-lg overflow-hidden" style={{ height: '200px' }}>
                <video autoPlay muted playsInline className="w-full h-full object-contain" ref={(video) => { if (video) video.srcObject = mediaStream; }} />
              </div>
            </div>
          )}
          <div className="p-4 flex-1">
            <div className="text-center">
              <div className="inline-block bg-cyan-500 text-white px-4 py-2 rounded-lg mb-4">Tutorial Play</div>
              <p className="text-gray-400 text-sm">Step 1 Up Arrow</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-6">
              <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span>{isRecording ? 'Live Recording' : 'Not Recording'}</span>
            </div>
            {isRecording && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-300">✅ Speak now - Gemini AI will respond automatically after each question!</p>
              </div>
            )}
            {sessionId && (
              <div className="mt-4 p-3 bg-green-900 rounded-lg">
                <p className="text-xs text-green-300">✅ Connected to AI</p>
                <p className="text-xs text-gray-400 mt-1">Session: {sessionId.slice(-8)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;