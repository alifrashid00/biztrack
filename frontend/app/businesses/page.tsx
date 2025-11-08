'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, Plus, Building2, Calendar, FileText, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

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

export default function BusinessesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<BusinessFormData>({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchBusinesses();
        }
    }, [user]);

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
                setBusinesses(data.businesses);
            } else {
                setError('Failed to fetch businesses');
            }
        } catch (error) {
            console.error('Error fetching businesses:', error);
            setError('Network error while fetching businesses');
        } finally {
            setLoadingBusinesses(false);
        }
    };

    const handleCreateBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses`, {
                method: 'POST',
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
                setShowCreateModal(false);
                setFormData({ name: '', description: '' });
                fetchBusinesses(); // Refresh the list
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create business');
            }
        } catch (error) {
            console.error('Error creating business:', error);
            setError('Network error while creating business');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBusiness = async (businessId: string) => {
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
                fetchBusinesses(); // Refresh the list
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete business');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            setError('Network error while deleting business');
        }
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
        setError(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-white">
            <Navigation
                businesses={businesses}
                showBusinessSelector={false}
            />

            <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
                {/* Header Section */}
                <div className="mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-slate-600 shadow-lg">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">
                                    My Businesses
                                </h1>
                                <p className="text-slate-600 mt-1">
                                    Manage and monitor all your business operations
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                            size="lg"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Business
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Card className="border-2 border-red-200 bg-red-50 shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-red-700">
                                <div className="p-2 rounded-lg bg-red-200 shadow-md">
                                    <AlertTriangle className="h-5 w-5 text-red-700" />
                                </div>
                                <p className="font-semibold">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loadingBusinesses ? (
                    <Card className="border-2 border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="py-16">
                            <div className="text-center">
                                <Loader2 className="h-16 w-16 animate-spin text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-600 text-lg font-medium">Loading businesses...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : businesses.length === 0 ? (
                    /* Empty State */
                    <Card className="border-2 border-dashed border-slate-300 bg-slate-50 shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="py-20">
                            <div className="text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="h-28 w-28 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto shadow-lg border-2 border-slate-200">
                                        <Store className="h-14 w-14 text-slate-600" />
                                    </div>
                                    <div className="absolute -top-2 -right-2">
                                        <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center shadow-lg">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-3">No businesses yet</h3>
                                <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
                                    Get started by creating your first business and unlock powerful AI-driven insights for inventory, sales, and customer analytics.
                                </p>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                    size="lg"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create Your First Business
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Business Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((business) => (
                            <Card 
                                key={business.id}
                                className="group hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-white cursor-pointer overflow-hidden rounded-xl"
                                onClick={() => router.push(`/businesses/${business.id}`)}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-2xl bg-slate-600 shadow-lg group-hover:bg-slate-700 group-hover:scale-105 transition-all duration-300">
                                            <Store className="h-7 w-7 text-white" />
                                        </div>
                                        <Badge className="bg-slate-600 text-white border-0 shadow-sm">
                                            Active
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors duration-300 mb-2">
                                        {business.name}
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 line-clamp-2 min-h-[2.5rem]">
                                        {business.description || 'No description provided'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 border-t border-slate-200">
                                    <div className="space-y-3 text-sm mb-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                                                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                            </div>
                                            <span className="font-medium text-slate-700">Created:</span>
                                            <span className="text-slate-600">{formatDate(business.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                                                <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
                                            </div>
                                            <span className="font-medium text-slate-700">Updated:</span>
                                            <span className="text-slate-600">{formatDate(business.updated_at)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-slate-600 hover:bg-slate-700 text-white shadow-md group-hover:shadow-lg transition-all duration-300 font-medium"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/businesses/${business.id}`);
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Business Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[550px] bg-white border-2 border-slate-200 shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 rounded-2xl bg-slate-600 shadow-lg">
                                <Plus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-800">
                                    Create New Business
                                </DialogTitle>
                                <DialogDescription className="text-slate-600 mt-1">
                                    Add a new business to start tracking and analyzing performance
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleCreateBusiness}>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-800 font-semibold flex items-center gap-2">
                                    <Store className="h-4 w-4 text-slate-600" />
                                    Business Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., TechMart Electronics"
                                    className="border-2 border-slate-300 focus:border-slate-600 transition-colors"
                                    required
                                    maxLength={100}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-slate-800 font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-600" />
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of your business operations and focus..."
                                    className="border-2 border-slate-300 focus:border-slate-600 transition-colors resize-none"
                                    rows={4}
                                    maxLength={500}
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">
                                        Optional but recommended for better organization
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium">
                                        {formData.description.length}/500
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeModals}
                                className="border-2 border-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !formData.name.trim()}
                                className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Business
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}