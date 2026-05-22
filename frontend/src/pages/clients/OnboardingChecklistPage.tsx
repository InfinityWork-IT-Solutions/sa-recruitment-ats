import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronLeft, FileText, Monitor, Package, Users, MoreHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const categoryIcons: Record<string, React.ReactNode> = {
  documents: <FileText className="w-4 h-4" />,
  access: <Monitor className="w-4 h-4" />,
  equipment: <Package className="w-4 h-4" />,
  hr: <Users className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  documents: 'bg-blue-100 text-blue-700',
  access: 'bg-purple-100 text-purple-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  hr: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function OnboardingChecklistPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [appId]);

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/applications/${appId}/onboarding`);
      setChecklist(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setChecklist(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post(`/applications/${appId}/onboarding`, {});
      setChecklist(res.data);
      toast.success('Onboarding checklist created!');
    } catch {
      toast.error('Failed to create checklist');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentState: boolean) => {
    try {
      const res = await apiClient.patch(`/applications/${appId}/onboarding/items/${itemId}`, {
        is_completed: !currentState,
      });
      setChecklist((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, is_completed: !currentState } : i),
        completed_count: !currentState ? prev.completed_count + 1 : prev.completed_count - 1,
        progress_percent: Math.round(((!currentState ? prev.completed_count + 1 : prev.completed_count - 1) / prev.total_count) * 100),
      }));
    } catch {
      toast.error('Failed to update item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Onboarding Checklist</h1>
              <p className="text-gray-500 text-sm mt-0.5">New hire documentation and setup tasks</p>
            </div>
          </div>
          {checklist && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{checklist.progress_percent}%</div>
              <div className="text-xs text-gray-500">{checklist.completed_count}/{checklist.total_count} done</div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-6">
        {!checklist ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No checklist yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create a checklist with SA HR default items pre-populated.</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Onboarding Checklist'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                <span>{checklist.completed_count} of {checklist.total_count} tasks complete</span>
                <span className="font-semibold text-blue-600">{checklist.progress_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${checklist.progress_percent}%` }}
                />
              </div>
            </div>

            {checklist.items?.map((item: any) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-4 cursor-pointer hover:shadow-sm transition-all ${item.is_completed ? 'border-green-200 opacity-75' : 'border-gray-200'}`}
                onClick={() => handleToggleItem(item.id, item.is_completed)}
              >
                <div className="mt-0.5">
                  {item.is_completed
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
                      {categoryIcons[item.category]}
                      {item.category}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
