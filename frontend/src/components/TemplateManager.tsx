
import React, { useState, useEffect } from 'react';
import { Mail, Edit2, Plus, Save, Trash2, Wand2, Check, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  template_type: string;
  subject: string;
  body_template: string;
  is_default: boolean;
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await apiClient.post('/templates/seed');
      await fetchTemplates();
      alert('Professional templates have been added to your account!');
    } catch (error) {
      console.error('Failed to seed templates:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = async (template: Template) => {
    try {
      setIsLoading(true);
      if (template.id.startsWith('new-')) {
        await apiClient.post('/templates', template);
      } else {
        await apiClient.put(`/templates/${template.id}`, template);
      }
      toast.success('Template saved successfully!');
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      setIsLoading(true);
      await apiClient.delete(`/templates/${id}`);
      toast.success('Template deleted successfully');
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    const newTemplate: Template = {
      id: `new-${Date.now()}`,
      name: 'New Template',
      template_type: 'custom',
      subject: '',
      body_template: '',
      is_default: false
    };
    setTemplates([newTemplate, ...templates]);
    setEditingTemplate(newTemplate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500">Manage professional emails sent to candidates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Generate Defaults
          </button>
          <button 
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {isLoading && !templates.length ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
          <p className="text-gray-500 mb-6">Start by generating our professional default templates.</p>
          <button
            onClick={handleSeed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Generate Professional Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{template.template_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingTemplate?.id === template.id ? (
                <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Body (Use {"{{variable}}"} for tags)</label>
                    <textarea
                      rows={6}
                      value={editingTemplate.body_template}
                      onChange={(e) => setEditingTemplate({...editingTemplate, body_template: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        if (template.id.startsWith('new-')) {
                          setTemplates(templates.filter(t => t.id !== template.id));
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(editingTemplate)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 line-clamp-2 italic">
                  "{template.subject}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
