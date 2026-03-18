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
import { Plus, Search, Building2, Edit, Trash2, X, Save, Mail, Phone, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { ClientCompany } from '@/types/api';

const clientCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    contact_person: z.string().optional(),
    contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
    contact_phone: z.string().optional(),
});

type ClientCompanyFormData = z.infer<typeof clientCompanySchema>;

export default function ClientCompaniesPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<ClientCompany | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    });

    const openCreateModal = () => {
        setEditingCompany(null);
        reset({});
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
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCompany(null);
        reset({});
    };

    const onSubmit = async (data: ClientCompanyFormData) => {
        try {
            if (editingCompany) {
                await updateCompany.mutateAsync({ id: editingCompany.id, data });
            } else {
                await createCompany.mutateAsync(data);
            }
            closeModal();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleDelete = async (id: string) => {
        await deleteCompany.mutateAsync(id);
        setDeleteConfirm(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Client Companies</h1>
                    <p className="text-gray-600 mt-1">Manage your client companies and contacts</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Client</span>
                </button>
            </div>

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Companies List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !data?.companies || data.companies.length === 0 ? (
                <div className="card text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No client companies found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first client company.</p>
                    <button onClick={openCreateModal} className="btn-primary inline-flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Add Client</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.companies.map((company) => (
                        <div key={company.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
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
                                        <a href={`mailto:${company.contact_email}`} className="hover:text-blue-600">
                                            {company.contact_email}
                                        </a>
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

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('name')}
                                    type="text"
                                    className="input"
                                    placeholder="Acme Corporation"
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
                                    placeholder="Technology, Finance, Healthcare..."
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

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Person
                                        </label>
                                        <input
                                            {...register('contact_person')}
                                            type="text"
                                            className="input"
                                            placeholder="John Doe"
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
                                            placeholder="john@example.com"
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
                                            placeholder="+27 21 555 1234"
                                        />
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
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Client Company?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this client company? This action cannot be undone.
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
                                className="btn-danger"
                            >
                                {deleteCompany.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
