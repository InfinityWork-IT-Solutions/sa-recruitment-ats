import { X, Shield, UserPlus, Building2 } from 'lucide-react';
import { useState } from 'react';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRole: string) => void;
  currentRole: string;
  memberName: string;
}

export default function ChangeRoleModal({
  isOpen,
  onClose,
  onSubmit,
  currentRole,
  memberName,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  if (!isOpen) return null;

  const roles = [
    {
      value: 'agency_admin',
      label: 'Admin',
      description: 'Full access to all features, team management, and billing',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    {
      value: 'recruiter',
      label: 'Recruiter',
      description: 'Manage candidates, jobs, applications, and interviews',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    {
      value: 'client',
      label: 'Client / Hiring Manager',
      description: 'View candidates and provide feedback on hiring decisions',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
  ];

  const handleSubmit = () => {
    onSubmit(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Change Role</h2>
            <p className="text-blue-100 text-sm mt-1">Update role for {memberName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Select a new role for <strong>{memberName}</strong>. This will update their permissions immediately.
          </p>

          <div className="space-y-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;

              return (
                <label
                  key={role.value}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? `${role.borderColor} ${role.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      value={role.value}
                      checked={isSelected}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? role.bgColor : 'bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? role.color : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isSelected ? role.color : 'text-gray-900'}`}>
                        {role.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={selectedRole === currentRole}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Role
          </button>
        </div>
      </div>
    </div>
  );
}
