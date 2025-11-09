import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; // Make sure this path is correct

const Forms = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live');
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    objectives: '',
    codingLanguage: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          uploadedDocumentContent: event.target.result
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleEnableMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicEnabled(true);
      alert('Microphone access granted!');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('Microphone access denied. Please check your browser settings.');
      console.error('Microphone error:', error);
    }
  };

  const handleStart = async () => {
    if (!formData.company || !formData.position || !formData.objectives) {
      alert('Please fill in Company, Position, and Objectives fields');
      return;
    }
    if (!micEnabled) {
      alert('Please enable microphone access before starting');
      return;
    }

    setLoading(true);
    try {
      const interviewData = {
        company: formData.company,
        position: formData.position,
        objectives: formData.objectives,
        codingLanguage: activeTab === 'coding' ? formData.codingLanguage : null,
        uploadedDocumentContent: formData.uploadedDocumentContent || null,
        interviewType: activeTab
      };

      // Call backend to start session with Gemini
      const response = await api.post('/interview/start', interviewData);
      const { sessionId } = response.data;

      navigate('/interview', {
        state: {
          sessionId,
          interviewType: activeTab,
          candidateInfo: {
            company: formData.company,
            position: formData.position,
            objectives: formData.objectives,
            codingLanguage: formData.codingLanguage
          }
        }
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to connect to AI server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  // UI remains 100% unchanged
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-black mb-8 text-center">Interview Setup</h1>
       
        <div className="flex gap-4 mb-8 border-b-2 border-black">
          <button onClick={() => setActiveTab('live')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'live' ? 'text-black border-b-4 border-black -mb-0.5' : 'text-gray-400 hover:text-gray-600'}`}>Live</button>
          <button onClick={() => setActiveTab('coding')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'coding' ? 'text-black border-b-4 border-black -mb-0.5' : 'text-gray-400 hover:text-gray-600'}`}>Coding</button>
        </div>

        {activeTab === 'live' && (
          <div className="space-y-6">
            <div><label htmlFor="company" className="block text-sm font-medium text-black mb-2">Company *</label><input type="text" id="company" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black" placeholder="Enter company name" required /></div>
            <div><label htmlFor="position" className="block text-sm font-medium text-black mb-2">Position *</label><input type="text" id="position" name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black" placeholder="Enter position" required /></div>
            <div><label htmlFor="objectives" className="block text-sm font-medium text-black mb-2">Objectives *</label><textarea id="objectives" name="objectives" value={formData.objectives} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black resize-none" placeholder="Enter your objectives" required /></div>
            <div><label className="block text-sm font-medium text-black mb-2">Upload Document (Resume/CV)</label><div className="relative"><input type="file" id="fileUpload" onChange={handleFileUpload} accept=".txt,.pdf,.doc,.docx" className="hidden" /><label htmlFor="fileUpload" className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"><span className="text-black">{uploadedFile ? uploadedFile.name : 'Choose a file'}</span><span className="text-black text-xl">Document</span></label></div></div>
            <button onClick={handleEnableMicrophone} className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${micEnabled ? 'bg-black text-white' : 'bg-white border-2 border-black text-black hover:bg-gray-50'}`}><span className="text-xl">Microphone</span>{micEnabled ? 'Microphone Enabled' : 'Enable Microphone Access'}</button>
            <button onClick={handleStart} disabled={loading} className="w-full px-4 py-4 bg-black text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-400">{loading ? 'Starting...' : 'Start'} {!loading && <span className="text-xl">Right Arrow</span>}</button>
          </div>
        )}

        {activeTab === 'coding' && (
          <div className="space-y-6">
            {/* Same inputs as live tab + codingLanguage */}
            <div><label htmlFor="company-coding" className="block text-sm font-medium text-black mb-2">Company *</label><input type="text" id="company-coding" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black" placeholder="Enter company name" required /></div>
            <div><label htmlFor="position-coding" className="block text-sm font-medium text-black mb-2">Position *</label><input type="text" id="position-coding" name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black" placeholder="Enter position" required /></div>
            <div><label htmlFor="objectives-coding" className="block text-sm font-medium text-black mb-2">Objectives *</label><textarea id="objectives-coding" name="objectives" value={formData.objectives} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black resize-none" placeholder="Enter your objectives" required /></div>
            <div><label htmlFor="codingLanguage" className="block text-sm font-medium text-black mb-2">Coding Language *</label><input type="text" id="codingLanguage" name="codingLanguage" value={formData.codingLanguage} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-black" placeholder="e.g., JavaScript, Python, Java" required /></div>
            <div><label className="block text-sm font-medium text-black mb-2">Upload Document (Resume/CV)</label><div className="relative"><input type="file" id="fileUpload-coding" onChange={handleFileUpload} accept=".txt,.pdf,.doc,.docx" className="hidden" /><label htmlFor="fileUpload-coding" className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"><span className="text-black">{uploadedFile ? uploadedFile.name : 'Choose a file'}</span><span className="text-black text-xl">Document</span></label></div></div>
            <button onClick={handleEnableMicrophone} className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${micEnabled ? 'bg-black text-white' : 'bg-white border-2 border-black text-black hover:bg-gray-50'}`}><span className="text-xl">Microphone</span>{micEnabled ? 'Microphone Enabled' : 'Enable Microphone Access'}</button>
            <button onClick={handleStart} disabled={loading} className="w-full px-4 py-4 bg-black text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-400">{loading ? 'Starting...' : 'Start'} {!loading && <span className="text-xl">Right Arrow</span>}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forms;