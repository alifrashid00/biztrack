"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastChart } from "@/components/ForecastChart";

interface Business { id: string; name: string; description?: string | null }
interface ForecastItem {
    product_id: string;
    product_name: string;
    demand_forecast_units: number;
    confidence_score?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForecastPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<string>("");
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [pageLoading, setPageLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push("/auth/login");
    }, [loading, user, router]);

    useEffect(() => {
        const loadBusinesses = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const resp = await fetch(`${API_BASE}/businesses`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await resp.json();
                setBusinesses(data.businesses || []);
                if (data.businesses?.[0]?.id) setSelectedBusiness(data.businesses[0].id);
            } catch (e) {
                setError("Failed to load businesses");
            }
        };
        loadBusinesses();
    }, []);

    useEffect(() => {
        const loadForecast = async () => {
            if (!selectedBusiness) return;
            try {
                setPageLoading(true);
                setError(null);
                const token = localStorage.getItem("access_token");
                const resp = await fetch(`${API_BASE}/forecast/generate/${selectedBusiness}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) {
                    const e = await resp.json().catch(() => ({}));
                    throw new Error(e.error || "Failed to load forecast");
                }
                const data = await resp.json();
                setForecast(data.forecast || []);
            } catch (e: any) {
                setError(e.message || "Failed to load forecast");
            } finally {
                setPageLoading(false);
            }
        };
        loadForecast();
    }, [selectedBusiness]);

    const chartData = useMemo(() => {
        if (!forecast?.length) return [{ month: "Next", forecast: 0 }];
        // Show top 6 products; use product name as x-axis label
        return forecast.slice(0, 6).map((f) => ({
            month: f.product_name || f.product_id,
            forecast: f.demand_forecast_units,
            confidence: typeof f.confidence_score === 'number' ? `${Math.round(f.confidence_score * 100)}%` : undefined,
        }));
    }, [forecast]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Demand Forecasting</h1>
                        <p className="text-sm text-muted-foreground">AI predictions per product for the next period</p>
                    </div>
                    <div>
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="px-4 py-2 rounded-md border border-border bg-card text-foreground min-w-[220px]"
                        >
                            {businesses.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-6">
                {error && (
                    <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">{error}</div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Next Period Forecast</CardTitle>
                        <CardDescription>Top products by expected units</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ForecastChart data={chartData} />
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {forecast.slice(0, 12).map((f) => (
                                <div key={f.product_id} className="p-4 rounded-lg border border-border bg-card/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium truncate max-w-[220px]" title={f.product_name}>{f.product_name}</div>
                                            <div className="text-xs text-muted-foreground">ID: {f.product_id}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold">{f.demand_forecast_units.toLocaleString()} units</div>
                                            {typeof f.confidence_score === 'number' && (
                                                <div className="text-xs text-muted-foreground">Confidence: {Math.round(f.confidence_score * 100)}%</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!forecast.length && !pageLoading && (
                                <div className="text-sm text-muted-foreground">No forecast yet. Upload and map data first.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
