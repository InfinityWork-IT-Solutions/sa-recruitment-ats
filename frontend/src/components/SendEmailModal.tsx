import { useState, useEffect } from 'react';
import { X, Send, Mail, Search, Eye, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { MessageTemplate } from '@/types/api';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    recipientType: 'candidate' | 'client';
}

export default function SendEmailModal({
    isOpen,
    onClose,
    recipientId,
    recipientName,
    recipientEmail,
    recipientType
}: SendEmailModalProps) {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/templates');
            setTemplates(response.data);
            if (response.data.length > 0) {
                handleTemplateSelect(response.data[0].id, response.data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            toast.error('Failed to load email templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string, templateList = templates) => {
        const template = templateList.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplateId(templateId);
            setSubject(template.subject || '');
            setBody(template.body_template || '');
        }
    };

    const handlePreview = async () => {
        try {
            const response = await apiClient.post('/templates/preview', {
                template_id: selectedTemplateId,
                variables: {
                    candidate_name: recipientName,
                    company_name: 'RecruitPro SA', // Should be dynamic
                    job_title: 'Software Developer', // Should be dynamic
                }
            });
            setSubject(response.data.subject);
            setBody(response.data.body);
            setPreviewMode(true);
        } catch (error) {
            toast.error('Failed to generate preview');
        }
    };

    const handleSend = async () => {
        setIsSending(true);
        try {
            const endpoint = recipientType === 'candidate' 
                ? `/templates/send-to-candidate?candidate_id=${recipientId}&template_id=${selectedTemplateId}`
                : `/templates/send-to-client?client_id=${recipientId}&template_id=${selectedTemplateId}`;
            
            await apiClient.post(endpoint, {
                custom_subject: subject,
                custom_body: body
            });
            
            toast.success('Email sent successfully!');
            onClose();
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Send Professional Email</h3>
                            <p className="text-sm text-gray-500">To: {recipientName} ({recipientEmail})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Template</label>
                        <div className="relative">
                            <select
                                value={selectedTemplateId}
                                onChange={(e) => handleTemplateSelect(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all"
                            >
                                <option value="">Choose a template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {templates.length === 0 && !isLoading && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                <p className="text-xs text-amber-700">No templates found. Go to Settings to create or generate default templates.</p>
                            </div>
                        )}
                    </div>

                    {/* Editor */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Email subject..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[200px]"
                                placeholder="Compose your message here..."
                            />
                            <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">You can use variables like {'{{candidate_name}}'} or {'{{company_name}}'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <button
                        onClick={handlePreview}
                        disabled={!selectedTemplateId}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview with Variables</span>
                    </button>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || !body || !subject}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>{isSending ? 'Sending...' : 'Send Email'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
