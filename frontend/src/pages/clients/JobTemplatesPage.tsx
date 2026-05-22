import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Pencil, Trash2, Copy, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';

export default function JobTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/jobs/templates');
      setTemplates(Array.isArray(res.data) ? res.data : res.data.templates || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      const res = await apiClient.post(`/jobs/templates/${template.id}/use`, {});
      toast.success('Job created from template! Edit and publish it from Jobs.');
      fetchTemplates();
    } catch {
      toast.error('Failed to use template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await apiClient.delete(`/jobs/${templateId}`);
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleSaveTemplate = async (data: any) => {
    try {
      await apiClient.post('/jobs/templates', data);
      toast.success('Template saved!');
      setShowCreateModal(false);
      fetchTemplates();
    } catch {
      toast.error('Failed to save template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Templates</h1>
            <p className="text-gray-500 text-sm mt-1">Reusable job description templates for faster posting</p>
          </div>
          <button
            onClick={() => { setPrefillData(null); setShowCreateModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No templates yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">Create reusable job description templates to speed up your hiring.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t: any) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{t.category} · {t.employment_type?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{t.description?.slice(0, 100)}...</p>

                {t.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {t.skills.slice(0, 3).map((s: string) => (
                      <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleUseTemplate(t)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PostJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSaveTemplate}
        integrations={null}
        isTemplate={true}
      />
    </div>
  );
}
