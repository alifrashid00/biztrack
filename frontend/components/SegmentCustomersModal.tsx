"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, User, Eye, Mail, Users } from "lucide-react";

interface SegmentCustomersModalProps {
  businessId: string;
  segment: string;
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer: (customerId: number) => void;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  recency_days: number;
  frequency_count: number;
  monetary_value: number;
  churn_risk_score: number;
  avg_order_value: number;
}

const getSegmentColor = (segment: string): string => {
  const segmentMap: { [key: string]: string } = {
    "Champions": "success",
    "Loyal Customers": "primary",
    "Potential Loyalists": "primary",
    "At Risk": "warning",
    "Cant Lose Them": "warning",
    "Hibernating": "warning",
    "Lost": "destructive",
    "New Customers": "default",
    "Promising": "default",
    "Need Attention": "warning"
  };
  return segmentMap[segment] || "default";
};

export const SegmentCustomersModal = ({ 
  businessId, 
  segment, 
  isOpen, 
  onClose,
  onViewCustomer
}: SegmentCustomersModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && segment && businessId) {
      fetchSegmentCustomers();
    }
  }, [isOpen, segment, businessId]);

  const fetchSegmentCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/segment-customers/${businessId}/${encodeURIComponent(segment)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch segment customers");

      const data = await response.json();
      setCustomers(data.customers || []);
      setStatistics(data.statistics);
    } catch (err) {
      console.error("Error fetching segment customers:", err);
      setError("Failed to load segment customers");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-white to-blue-50/30 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border-2 border-slate-200/50">
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b-2 border-slate-200/50 bg-gradient-to-r from-white to-blue-50/30">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            segment === 'Champions' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
            segment === 'Loyal Customers' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
            segment.includes('At Risk') ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
            'bg-gradient-to-r from-purple-600 to-pink-600'
          }`} />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-xl shadow-lg ${
                segment === 'Champions' ? 'bg-gradient-to-br from-emerald-600 to-teal-600' :
                segment === 'Loyal Customers' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                segment.includes('At Risk') ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
                'bg-gradient-to-br from-purple-600 to-pink-600'
              }`}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <h2 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                segment === 'Champions' ? 'from-emerald-700 to-teal-700' :
                segment === 'Loyal Customers' ? 'from-blue-700 to-cyan-700' :
                segment.includes('At Risk') ? 'from-amber-700 to-orange-700' :
                'from-purple-700 to-pink-700'
              }`}>{segment} Customers</h2>
              <Badge className={`border-0 text-white shadow-md ${
                segment === 'Champions' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                segment === 'Loyal Customers' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                segment.includes('At Risk') ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}>{customers.length} Customers</Badge>
            </div>
            {statistics && (
              <div className="flex items-center gap-4 text-sm font-medium text-slate-700 ml-16">
                <span>Total Revenue: <span className="font-bold">${statistics.total_revenue?.toFixed(2) || 0}</span></span>
                <span>Avg: <span className="font-bold">${statistics.avg_revenue?.toFixed(2) || 0}</span></span>
                <span>Frequency: <span className="font-bold">{statistics.avg_frequency?.toFixed(1) || 0}</span></span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-blue-50">
            <X className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchSegmentCustomers}>Retry</Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No customers in this segment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <Card key={customer.customer_id} className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 group">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    segment === 'Champions' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                    segment === 'Loyal Customers' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                    segment.includes('At Risk') ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                    'bg-gradient-to-r from-purple-600 to-pink-600'
                  }`} />
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${
                          segment === 'Champions' ? 'bg-gradient-to-br from-emerald-600 to-teal-600' :
                          segment === 'Loyal Customers' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                          segment.includes('At Risk') ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
                          'bg-gradient-to-br from-purple-600 to-pink-600'
                        }`}>
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-slate-900 truncate">
                              {customer.customer_name}
                            </h3>
                            {customer.churn_risk_score >= 50 && (
                              <Badge className="text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white border-0">
                                High Risk
                              </Badge>
                            )}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Recency</p>
                              <p className="text-sm font-semibold">{customer.recency_days} days</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Orders</p>
                              <p className="text-sm font-semibold">{customer.frequency_count}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Spent</p>
                              <p className="text-sm font-semibold">${customer.monetary_value.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Avg Order</p>
                              <p className="text-sm font-semibold">${customer.avg_order_value.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onViewCustomer(customer.customer_id);
                          onClose();
                        }}
                        className="border-2 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-slate-200/50 bg-gradient-to-r from-white to-blue-50/30">
          <div className="text-sm font-medium text-slate-700">
            <span className="font-bold">{customers.length}</span> customers • <span className="font-bold">${statistics?.total_revenue?.toFixed(2) || 0}</span> total revenue
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-2 hover:bg-slate-50">Close</Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
              <Mail className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
