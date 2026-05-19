/**
 * 🎥 VIDEO RECORDER COMPONENT - CORE RECORDING FUNCTIONALITY
 */

import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, StopCircle, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface VideoRecorderProps {
  maxDuration: number; // in seconds
  onRecordingComplete: (videoBlob: Blob, videoUrl: string) => void;
  onCancel?: () => void;
}

export default function VideoRecorder({ 
  maxDuration, 
  onRecordingComplete, 
  onCancel 
}: VideoRecorderProps) {
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any | null>(null);

  useEffect(() => {
    requestCameraPermission();
    
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera and microphone access.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError('No camera stream available');
      return;
    }

    try {
      chunksRef.current = [];
      setRecordedBlob(null);
      setRecordedUrl(null);
      setTimeRemaining(maxDuration);

      const options = { mimeType: 'video/webm;codecs=vp9' };
      // Check if browser supports the mimeType
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';
        
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setRecordedBlob(blob);
        setRecordedUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setError(null);

      startTimer();
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          stopRecording();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  };

  const retakeVideo = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTimeRemaining(maxDuration);
    
    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.src = '';
    }
  };

  const acceptVideo = () => {
    if (recordedBlob && recordedUrl) {
      onRecordingComplete(recordedBlob, recordedUrl);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <VideoOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Camera Access Needed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
            <strong className="text-blue-900">How to enable:</strong>
            <ol className="mt-2 space-y-1 text-sm text-blue-800 list-decimal ml-5">
              <li>Click camera icon in address bar</li>
              <li>Select "Allow"</li>
              <li>Refresh page</li>
            </ol>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={requestCameraPermission}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Try Again
            </button>
            {onCancel && (
              <button onClick={onCancel} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center">
        <Video className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Requesting camera access...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isRecording || !recordedUrl}
          className="w-full h-full object-cover"
        />
        
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-bold bg-black bg-opacity-50 px-3 py-1 rounded">REC</span>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
            timeRemaining <= 10 && isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-black bg-opacity-50 text-white'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        {recordedUrl && !isRecording && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Recording Complete!
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50">
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4">
          
          {!isRecording && !recordedUrl && (
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold text-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 flex items-center"
            >
              <Video className="w-6 h-6 mr-2" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg shadow-lg hover:bg-black transition-all flex items-center"
            >
              <StopCircle className="w-6 h-6 mr-2" />
              Stop Recording
            </button>
          )}

          {recordedUrl && !isRecording && (
            <>
              <button
                onClick={retakeVideo}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Re-record
              </button>
              
              <button
                onClick={acceptVideo}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 flex items-center"
              >
                <Check className="w-6 h-6 mr-2" />
                Accept & Continue
              </button>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {!isRecording && !recordedUrl && (
            <p>Click "Start Recording" when ready. You have {formatTime(maxDuration)} to respond.</p>
          )}
          {isRecording && (
            <p>Recording... Click "Stop" when done or let timer run out.</p>
          )}
          {recordedUrl && !isRecording && (
            <p>Review your recording. Re-record if needed or accept to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}
