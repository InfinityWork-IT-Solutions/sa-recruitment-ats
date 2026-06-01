import { X, UserPlus, Mail, Shield, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  role: z.enum(['agency_admin', 'recruiter', 'client']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InviteFormData) => Promise<void>;
  availableSeats: number;
}

export default function InviteTeamMemberModal({
  isOpen,
  onClose,
  onSubmit,
  availableSeats,
}: InviteTeamMemberModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'recruiter' },
  });

  if (!isOpen) return null;

  const selectedRole = watch('role');

  const roles = [
    {
      value: 'agency_admin' as const,
      label: 'Admin',
      description: 'Full access — team management, billing, and all features',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    {
      value: 'recruiter' as const,
      label: 'Recruiter',
      description: 'Manage candidates, jobs, applications, and interviews',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    {
      value: 'client' as const,
      label: 'Client / Hiring Manager',
      description: 'View candidates and provide feedback on hiring decisions',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
  ];

  const handleFormSubmit = async (data: InviteFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Invite Team Member</h2>
              <p className="text-blue-100 text-sm mt-1">
                {availableSeats} seat{availableSeats !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {availableSeats === 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-900">No seats available. Upgrade your plan to invite more members.</p>
              </div>
            )}

            {/* Personal info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    {...register('first_name')}
                    type="text"
                    placeholder="Jane"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    {...register('last_name')}
                    type="text"
                    placeholder="Smith"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="jane@company.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            {/* Role selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Role</h3>
              <div className="space-y-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <label
                      key={role.value}
                      className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                        isSelected ? `${role.borderColor} ${role.bgColor}` : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input type="radio" value={role.value} {...register('role')} className="sr-only" />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? role.bgColor : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? role.color : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? role.color : 'text-gray-800'}`}>{role.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-900 mb-1.5">What happens next?</p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• An invitation email is sent to <strong>{watch('email') || 'the provided address'}</strong></li>
                <li>• They click the link and create their own password</li>
                <li>• Their account is activated and they can log in immediately</li>
                <li>• The invitation link expires in <strong>7 days</strong></li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableSeats === 0}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" />
              {isSubmitting ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
