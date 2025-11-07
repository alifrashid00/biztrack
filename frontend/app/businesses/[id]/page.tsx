'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DataMapper from '@/components/DataMapper';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Store, Upload, Database, FileSpreadsheet, Loader2, Edit, Trash2, Eye, EyeOff, Brain } from "lucide-react";

interface Business {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface BusinessFormData {
    name: string;
    description: string;
}

interface UploadResult {
    fileName: string;
    sheets?: {
        sheetName: string;
        collectionName: string;
        rowCount: number;
        headers: string[];
    }[];
    error?: string;
}

export default function BusinessDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState<BusinessFormData>({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    
    // Business selection state
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);
    
    // Excel upload states
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && businessId) {
            fetchBusiness();
        }
    }, [user, businessId]);

    useEffect(() => {
        if (user) {
            fetchBusinesses();
        }
    }, [user]);

    const fetchBusiness = async () => {
        try {
            setLoadingBusiness(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBusiness(data.business);
            } else {
                setError('Failed to fetch business');
            }
        } catch (error) {
            console.error('Error fetching business:', error);
            setError('Network error while fetching business');
        } finally {
            setLoadingBusiness(false);
        }
    };

    const fetchBusinesses = async () => {
        try {
            setLoadingBusinesses(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses || []);
            } else {
                console.error('Failed to fetch businesses');
            }
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoadingBusinesses(false);
        }
    };

    const handleEditBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                }),
            });

            if (response.ok) {
                setShowEditModal(false);
                setFormData({ name: '', description: '' });
                fetchBusiness(); // Refresh the data
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update business');
            }
        } catch (error) {
            console.error('Error updating business:', error);
            setError('Network error while updating business');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBusiness = async () => {
        if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                router.push('/businesses'); // Redirect to businesses list
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete business');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            setError('Network error while deleting business');
        }
    };

    const openEditModal = () => {
        if (business) {
            setFormData({ name: business.name, description: business.description || '' });
            setShowEditModal(true);
        }
    };

    const closeModals = () => {
        setShowEditModal(false);
        setFormData({ name: '', description: '' });
        setError(null);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploadingFiles(true);
            setUploadResults([]);
            setError(null);

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/upload-excel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadResults(data.results || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to upload files');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            setError('Network error while uploading files');
        } finally {
            setUploadingFiles(false);
            // Reset the file input
            event.target.value = '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-t-4 border-indigo-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <p className="mt-6 text-slate-700 font-semibold text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b-2 border-slate-200/50 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push("/businesses")} className="hover:bg-indigo-100">
                                <ArrowLeft className="h-5 w-5 text-indigo-600" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Business Details</h1>
                                <p className="text-sm text-slate-600">Manage your business data and settings</p>
                            </div>
                        </div>

                        {/* Business Selector */}
                        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-indigo-200/50 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Store className="h-4 w-4 text-white" />
                            </div>
                            <select
                                value={businessId}
                                onChange={(e) => {
                                    if (e.target.value && e.target.value !== businessId) {
                                        router.push(`/businesses/${e.target.value}`);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg border-0 bg-transparent text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                                disabled={loadingBusinesses}
                            >
                                {loadingBusinesses ? (
                                    <option>Loading...</option>
                                ) : (
                                    businesses.map((biz) => (
                                        <option key={biz.id} value={biz.id}>
                                            {biz.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-6">
                {error && (
                    <Card className="border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-white shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="pt-6">
                            <p className="text-red-700 font-semibold">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {loadingBusiness ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : business ? (
                    <>
                        {/* Business Info Card */}
                        <Card className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <Store className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-800">{business.name}</CardTitle>
                                            <CardDescription className="text-slate-600 mt-1">
                                                {business.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={openEditModal}
                                            variant="outline"
                                            className="border-2 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold transition-all duration-300"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Business
                                        </Button>
                                        <Button
                                            onClick={handleDeleteBusiness}
                                            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md font-semibold"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Business
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md font-semibold"
                                        >
                                            <Database className="h-4 w-4 mr-2" />
                                            View Raw Data
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/unified-data`)}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md font-semibold"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Unified Data
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Excel Upload Section */}
                        <Card className="border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                        <Upload className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">Upload Excel Files</CardTitle>
                                        <CardDescription className="text-slate-600">
                                            Upload Excel files (.xls, .xlsx) to create MongoDB collections. Each sheet will be converted to a separate collection with documents mapped from the rows and columns.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300">
                                        <Upload className="h-4 w-4 mr-2" />
                                        <input
                                            type="file"
                                            multiple
                                            accept=".xls,.xlsx,.xlsm"
                                            onChange={handleFileUpload}
                                            disabled={uploadingFiles}
                                            className="hidden"
                                        />
                                        {uploadingFiles ? 'Uploading...' : 'Choose Excel Files'}
                                    </label>
                                </div>

                                {/* Upload Results */}
                                {uploadResults.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Upload Results:</h4>
                                        <div className="space-y-2">
                                            {uploadResults.map((result, index) => (
                                                <div key={index} className={`p-4 rounded-xl border-2 ${result.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} shadow-sm`}>
                                                    <p className={`text-sm font-semibold ${result.error ? 'text-red-800' : 'text-emerald-800'}`}>
                                                        {result.fileName}
                                                    </p>
                                                    {result.error ? (
                                                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                                    ) : (
                                                        <div className="text-xs text-emerald-700 mt-1 space-y-0.5">
                                                            {result.sheets?.map((sheet, idx) => (
                                                                <div key={idx}>
                                                                    Sheet &quot;{sheet.sheetName}&quot;: {sheet.rowCount} rows → {sheet.collectionName}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Data Mapping Section */}
                        <Card className="border-2 border-indigo-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                                        <Brain className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">AI Data Mapping</CardTitle>
                                        <CardDescription className="text-slate-600">
                                            Use AI to automatically map and structure your uploaded data
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataMapper
                                    businessId={businessId}
                                    onMappingComplete={() => {
                                        // Mapping completed
                                    }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-2 border-red-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                            <CardContent className="pt-8 pb-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                                        <Store className="h-10 w-10 text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Business not found</h3>
                                    <p className="text-slate-600 mb-6">The business you're looking for doesn't exist or you don't have access to it.</p>
                                    <Button
                                        onClick={() => router.push('/businesses')}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-semibold"
                                    >
                                        Back to Businesses
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="border-2 border-red-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="pt-8 pb-8">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                                    <Store className="h-10 w-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Business not found</h3>
                                <p className="text-slate-600 mb-6">The business you're looking for doesn't exist or you don't have access to it.</p>
                                <Button
                                    onClick={() => router.push('/businesses')}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-semibold"
                                >
                                    Back to Businesses
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </main>

            {/* Edit Business Modal */}
            {showEditModal && business && (
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-indigo-200/50 shadow-2xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Business</DialogTitle>
                            <DialogDescription className="text-slate-600">
                                Update your business information and settings.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditBusiness} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">Business Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={100}
                                    className="border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-sm font-semibold text-slate-700">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    maxLength={500}
                                    className="border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModals}
                                    className="border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
