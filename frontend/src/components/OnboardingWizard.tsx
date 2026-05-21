import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Briefcase, Users, X, Camera, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const STORAGE_KEY = 'onboarding_dismissed';

export function useOnboardingVisible(hasJobs: boolean, hasTeam: boolean, hasLogo: boolean) {
  if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) return false;
  return !hasJobs || !hasTeam || !hasLogo;
}

interface Props {
  onDismiss: () => void;
  hasLogo: boolean;
  hasJobs: boolean;
  hasTeam: boolean;
}

export default function OnboardingWizard({ onDismiss, hasLogo, hasJobs, hasTeam }: Props) {
  const navigate = useNavigate();
  const { refreshUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 'logo',
      icon: <Camera className="w-6 h-6" />,
      title: 'Upload your company logo',
      description: 'A logo makes your job posts stand out and builds trust with candidates.',
      done: hasLogo,
      cta: 'Upload Logo',
      action: () => fileRef.current?.click(),
    },
    {
      id: 'job',
      icon: <Briefcase className="w-6 h-6" />,
      title: 'Post your first job',
      description: 'Start receiving applications and let the AI find your top matches.',
      done: hasJobs,
      cta: 'Post a Job',
      action: () => { navigate('/company/jobs'); onDismiss(); },
    },
    {
      id: 'team',
      icon: <Users className="w-6 h-6" />,
      title: 'Invite a team member',
      description: 'Collaborate with your HR team to review candidates together.',
      done: hasTeam,
      cta: 'Invite Someone',
      action: () => { navigate('/company/team'); onDismiss(); },
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      await apiClient.post('/client-companies/upload-logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Logo uploaded!');
      refreshUser();
      setStep(1);
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onDismiss();
  };

  if (pct === 100) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />

      <button
        onClick={dismiss}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold">Complete your setup</h2>
          <span className="bg-white/20 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {completedCount}/{steps.length}
          </span>
        </div>
        <p className="text-blue-100 text-sm mb-5">
          A complete profile attracts 3× more quality candidates.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-6">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={s.done ? undefined : s.action}
              disabled={s.done || (s.id === 'logo' && logoUploading)}
              className={`text-left p-4 rounded-xl transition-all flex items-start gap-3 ${
                s.done
                  ? 'bg-white/10 opacity-60 cursor-default'
                  : 'bg-white/20 hover:bg-white/30 cursor-pointer'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-green-400' : 'bg-white/30'}`}>
                {s.done ? <CheckCircle className="w-5 h-5 text-white" /> : s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">{s.description}</p>
                {!s.done && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-white/90">
                    {s.id === 'logo' && logoUploading ? 'Uploading...' : s.cta}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Hidden file input for logo */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>
    </div>
  );
}
