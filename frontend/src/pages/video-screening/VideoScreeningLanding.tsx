/**
 * 🎬 VIDEO SCREENING LANDING PAGE - CANDIDATE ENTRY POINT
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ScreeningInfo {
  invitation_id: string;
  job_title: string;
  company_name: string;
  questions_count: number;
  estimated_time: number;
  expires_at: string;
  status: string;
}

export default function VideoScreeningLanding() {
  const { access_token } = useParams<{ access_token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [screeningInfo, setScreeningInfo] = useState<ScreeningInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScreeningInfo();
  }, [access_token]);

  const fetchScreeningInfo = async () => {
    try {
      const response = await fetch(`/api/v1/video-screening/info/${access_token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invalid or expired link');
        } else if (response.status === 410) {
          setError('This video screening has already been completed');
        } else {
          setError('Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setScreeningInfo(data);
    } catch (err) {
      setError('Unable to load screening. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScreening = () => {
    navigate(`/video-screening/${access_token}/record`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your video screening...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !screeningInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600">{error}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <strong>What you can do:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>Check if you clicked the correct link from your email</li>
              <li>Make sure the link hasn't expired (valid for 7 days)</li>
              <li>Contact the company if you need a new invitation</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Check if expired
  const isExpired = new Date(screeningInfo.expires_at) < new Date();
  const expiresDate = new Date(screeningInfo.expires_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video Screening
          </h1>
          <p className="text-xl text-gray-600">
            {screeningInfo.company_name}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Job Info */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">
              {screeningInfo.job_title}
            </h2>
            <p className="text-blue-100">
              Thank you for applying! We'd like to learn more about you through a quick video screening.
            </p>
          </div>

          {/* Details */}
          <div className="p-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{screeningInfo.questions_count}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{screeningInfo.estimated_time} min</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">Easy</div>
                <div className="text-sm text-gray-600">No Stress</div>
              </div>
            </div>

            {/* What to Expect */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📋 What to Expect
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Answer {screeningInfo.questions_count} questions</div>
                    <div className="text-sm text-gray-600">Each question allows up to 2 minutes to respond</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Record your responses</div>
                    <div className="text-sm text-gray-600">Use your phone or computer camera - we'll guide you through it</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Review and submit</div>
                    <div className="text-sm text-gray-600">You can re-record any answer before submitting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="text-2xl">💡</div>
                </div>
                <div className="ml-3">
                  <h4 className="font-bold text-yellow-900 mb-2">Quick Tips for Success</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>✅ Find a quiet space with good lighting</li>
                    <li>✅ Look at the camera when speaking (not the screen)</li>
                    <li>✅ Be yourself - we want to get to know the real you!</li>
                    <li>✅ Speak clearly and at a natural pace</li>
                    <li>✅ Take a moment to think before answering</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Expiration Warning */}
            {isExpired ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <strong>This invitation has expired</strong>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Please contact {screeningInfo.company_name} for a new invitation.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-blue-800">
                  <Clock className="w-5 h-5 mr-2" />
                  <strong>Complete by: {expiresDate.toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</strong>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleStartScreening}
              disabled={isExpired}
              className={`
                w-full py-4 px-8 rounded-xl font-bold text-lg shadow-lg transition-all transform
                ${isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl'
                }
              `}
            >
              {isExpired ? (
                '⏰ Invitation Expired'
              ) : (
                <>
                  <Video className="inline-block w-6 h-6 mr-2 -mt-1" />
                  Start Video Screening →
                </>
              )}
            </button>

            {/* Privacy Note */}
            <p className="text-center text-sm text-gray-500 mt-6">
              🔒 Your video responses are private and will only be viewed by {screeningInfo.company_name}'s recruitment team.
            </p>
          </div>
        </div>

        {/* Footer Help */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Need help? Contact {screeningInfo.company_name} directly.</p>
          <p className="mt-2">Powered by <strong>RecruitPro SA</strong></p>
        </div>

      </div>
    </div>
  );
}
