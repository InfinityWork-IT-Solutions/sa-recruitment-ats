import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    useClientCompanies,
    useCreateClientCompany,
    useUpdateClientCompany,
    useDeleteClientCompany,
} from '@/hooks/use-client-companies';
import { Plus, Search, Building2, Edit, Trash2, X, Save, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ClientCompany } from '@/types/api';
import SendEmailModal from '@/components/SendEmailModal';

const clientCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    contact_person: z.string().optional(),
    contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    company_size: z.string().optional(),
    description: z.string().optional(),
});

type ClientCompanyFormData = z.infer<typeof clientCompanySchema>;

export default function ClientCompaniesPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<ClientCompany | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [emailModal, setEmailModal] = useState<{ isOpen: boolean; company: ClientCompany | null }>({
        isOpen: false,
        company: null
    });

    const { data, isLoading } = useClientCompanies({ search, limit: 50 });
    const createCompany = useCreateClientCompany();
    const updateCompany = useUpdateClientCompany();
    const deleteCompany = useDeleteClientCompany();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClientCompanyFormData>({
        resolver: zodResolver(clientCompanySchema),
        defaultValues: {
            country: '',
        },
    });

    const openCreateModal = () => {
        setEditingCompany(null);
        reset({ country: 'South Africa' });
        setShowModal(true);
    };

    const openEditModal = (company: ClientCompany) => {
        setEditingCompany(company);
        reset({
            name: company.name,
            industry: company.industry || '',
            website: company.website || '',
            contact_person: company.contact_person || '',
            contact_email: company.contact_email || '',
            contact_phone: company.contact_phone || '',
            address: company.address || '',
            city: company.city || '',
            province: company.province || '',
            country: company.country || 'South Africa',
            company_size: company.company_size || '',
            description: company.description || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCompany(null);
        reset();
    };

    const onSubmit = async (data: ClientCompanyFormData) => {
        try {
            if (editingCompany) {
                await updateCompany.mutateAsync({
                    id: editingCompany.id,
                    data,
                });
            } else {
                await createCompany.mutateAsync(data);
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save company:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCompany.mutateAsync(id);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete company:', error);
        }
    };

    const companies = data?.companies || [];

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Client Companies</h1>
                <p className="text-gray-600">Manage your client companies and contacts</p>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Client</span>
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : companies.length === 0 ? (
                <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No client companies found</p>
                    <button
                        onClick={openCreateModal}
                        className="mt-4 btn-primary inline-flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Your First Client</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                        <div
                            key={company.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                                        {company.industry && (
                                            <p className="text-sm text-gray-500">{company.industry}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => openEditModal(company)}
                                        className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(company.id)}
                                        className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {company.contact_person && (
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <span className="font-medium">Contact:</span>
                                        <span>{company.contact_person}</span>
                                    </div>
                                )}
                                {company.contact_email && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <button 
                                            onClick={() => setEmailModal({ isOpen: true, company })}
                                            className="hover:text-blue-600 text-left font-medium"
                                        >
                                            {company.contact_email}
                                        </button>
                                    </div>
                                )}
                                {company.contact_phone && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${company.contact_phone}`}>
                                            {company.contact_phone}
                                        </a>
                                    </div>
                                )}
                                {company.website && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Globe className="w-4 h-4" />
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600"
                                        >
                                            Website
                                        </a>
                                    </div>
                                )}
                                {(company.city || company.province) && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>
                                            {[company.city, company.province].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                                <span className="text-gray-600">{company.jobs_count} jobs</span>
                                <span className="text-gray-500 text-xs">
                                    Added {format(new Date(company.created_at), 'MMM yyyy')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {editingCompany ? 'Edit Client Company' : 'Add Client Company'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Company Information */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Company Information</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            className="input"
                                            placeholder="ABC Tech Solutions"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Industry
                                        </label>
                                        <input
                                            {...register('industry')}
                                            type="text"
                                            className="input"
                                            placeholder="Technology"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Website
                                        </label>
                                        <input
                                            {...register('website')}
                                            type="url"
                                            className="input"
                                            placeholder="https://example.com"
                                        />
                                        {errors.website && (
                                            <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Size
                                        </label>
                                        <select 
                                            {...register('company_size')}
                                            className="input"
                                        >
                                            <option value="">Select Size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="500+">500+ employees</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            {...register('description')}
                                            rows={3}
                                            className="input"
                                            placeholder="Company mission and values..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Person
                                        </label>
                                        <input
                                            {...register('contact_person')}
                                            type="text"
                                            className="input"
                                            placeholder="John Smith"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Email
                                        </label>
                                        <input
                                            {...register('contact_email')}
                                            type="email"
                                            className="input"
                                            placeholder="john@abctech.com"
                                        />
                                        {errors.contact_email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Phone
                                        </label>
                                        <input
                                            {...register('contact_phone')}
                                            type="tel"
                                            className="input"
                                            placeholder="+27 21 123 4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location Information */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Location</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <input
                                            {...register('address')}
                                            type="text"
                                            className="input"
                                            placeholder="123 Main Street, Building A"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City
                                            </label>
                                            <input
                                                {...register('city')}
                                                type="text"
                                                className="input"
                                                placeholder="Cape Town"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Province
                                            </label>
                                            <input
                                                {...register('province')}
                                                type="text"
                                                className="input"
                                                placeholder="e.g. Western Cape or California"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Country
                                            </label>
                                            <input
                                                {...register('country')}
                                                type="text"
                                                className="input"
                                                placeholder="e.g. United Kingdom"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createCompany.isPending || updateCompany.isPending}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    {(createCompany.isPending || updateCompany.isPending) ? (
                                        <>
                                            <Save className="w-4 h-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>{editingCompany ? 'Save Changes' : 'Create Client'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Company?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this company? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleteCompany.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {deleteCompany.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Email Modal */}
            {emailModal.company && (
                <SendEmailModal
                    isOpen={emailModal.isOpen}
                    onClose={() => setEmailModal({ isOpen: false, company: null })}
                    recipientId={emailModal.company.id}
                    recipientName={emailModal.company.contact_person || emailModal.company.name}
                    recipientEmail={emailModal.company.contact_email || ''}
                    recipientType="client"
                />
            )}
        </div>
    );
}
