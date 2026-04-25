/**
 * 🎥 VIDEO RECORDING PAGE - ORCHESTRATOR FOR SCREENING
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import VideoRecorder from '../../components/video-screening/VideoRecorder';

interface Question {
  text: string;
  duration?: number;
}

export default function VideoRecordingPage() {
  const { access_token } = useParams<{ access_token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [access_token]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/v1/video-screening/questions/${access_token}`);
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError('Unable to load questions. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (videoBlob: Blob, videoUrl: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('question_index', currentQuestionIndex.toString());
      formData.append('question_text', questions[currentQuestionIndex].text);
      formData.append('video', videoBlob, `question_${currentQuestionIndex}.webm`);

      const response = await fetch(`/api/v1/video-screening/upload/${access_token}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        await finalizeScreening();
      }
    } catch (err) {
      alert('Failed to upload video. Please try recording again.');
    } finally {
      setUploading(false);
    }
  };

  const finalizeScreening = async () => {
    try {
      const response = await fetch(`/api/v1/video-screening/complete/${access_token}`, {
        method: 'POST',
      });
      if (response.ok) {
        navigate(`/video-screening/${access_token}/complete`);
      }
    } catch (err) {
      console.error('Finalize error:', err);
      navigate(`/video-screening/${access_token}/complete`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question display */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border-l-8 border-blue-600">
          <h2 className="text-sm uppercase tracking-wider text-blue-600 font-bold mb-2">Current Question</h2>
          <p className="text-2xl font-bold text-gray-900">
            {currentQuestion?.text}
          </p>
        </div>

        {/* Recorder */}
        {uploading ? (
          <div className="bg-white rounded-2xl shadow-xl p-20 text-center">
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900">Uploading your response...</h3>
            <p className="text-gray-600">Please don't close your browser.</p>
          </div>
        ) : (
          <VideoRecorder 
            maxDuration={currentQuestion?.duration || 120}
            onRecordingComplete={handleRecordingComplete}
          />
        )}

      </div>
    </div>
  );
}
