
import React, { useState, useEffect } from 'react';
import { Mail, X, Send, Eye, Edit3, ChevronRight, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  subject: string;
  body_template: string;
}

interface EmailCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
}

export default function EmailCandidateModal({ isOpen, onClose, candidateId, candidateName }: EmailCandidateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'select' | 'edit'>('select');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setStep('select');
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    try {
      // Get preview from backend to handle variable merging
      const response = await apiClient.post('/templates/preview', {
        template_id: template.id,
        variables: { candidate_name: candidateName }
      });
      setSubject(response.data.subject);
      setBody(response.data.body);
      setStep('edit');
    } catch (error) {
      toast.error('Failed to prepare template');
    }
  };

  const handleSend = async () => {
    try {
      setIsSending(true);
      await apiClient.post('/templates/send-to-candidate', {
        candidate_id: candidateId,
        template_id: selectedTemplate?.id,
        custom_subject: subject,
        custom_body: body
      });
      toast.success('Email sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Email {{ candidateName }}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === 'select' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Choose a professional template to get started:</p>
              <div className="grid grid-cols-1 gap-3">
                {templates.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 italic">No templates found. Create some in Settings.</p>
                  </div>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                          <Edit3 className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[300px]">{t.subject}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setStep('select')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  ← Back to templates
                </button>
                <span className="text-xs text-gray-400">Editing: {selectedTemplate?.name}</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message Body</label>
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for spinning refresh icon (needed for isSending state)
function RefreshCw(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
