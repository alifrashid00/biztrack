"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, User, Eye, Mail, AlertTriangle } from "lucide-react";

interface AtRiskCustomersModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer: (customerId: number) => void;
}

interface AtRiskCustomer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  rfm_segment: string;
  recency_days: number;
  last_purchase_date: string;
  monetary_value: number;
  frequency_count: number;
  churn_risk_score: number;
}

const getRiskLevel = (score: number): { label: string; variant: string; color: string } => {
  if (score >= 90) return { label: "Critical", variant: "destructive", color: "text-destructive" };
  if (score >= 70) return { label: "High", variant: "destructive", color: "text-destructive" };
  if (score >= 50) return { label: "Medium", variant: "warning", color: "text-warning" };
  return { label: "Low", variant: "default", color: "text-muted-foreground" };
};

export const AtRiskCustomersModal = ({ 
  businessId, 
  isOpen, 
  onClose,
  onViewCustomer
}: AtRiskCustomersModalProps) => {
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) {
      fetchAtRiskCustomers();
    }
  }, [isOpen, businessId]);

  const fetchAtRiskCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/at-risk/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch at-risk customers");

      const data = await response.json();
      setCustomers(data.at_risk_customers || []);
      setStatistics(data.statistics);
    } catch (err) {
      console.error("Error fetching at-risk customers:", err);
      setError("Failed to load at-risk customers");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-white to-amber-50/30 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border-2 border-slate-200/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-200/50 bg-gradient-to-r from-white to-amber-50/30">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">At-Risk Customers</h2>
              <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 shadow-md">{customers.length} Customers</Badge>
            </div>
            {statistics && (
              <div className="flex items-center gap-4 text-sm font-medium text-slate-700 ml-16">
                <span>Revenue at Risk: <span className="font-bold">${statistics.total_revenue_at_risk?.toFixed(2) || 0}</span></span>
                <span>High Risk: <span className="font-bold">{statistics.high_risk_count || 0}</span></span>
                <span>Avg Churn Risk: <span className="font-bold">{statistics.avg_churn_risk?.toFixed(1) || 0}%</span></span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-amber-50">
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
              <Button onClick={fetchAtRiskCustomers}>Retry</Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
              <p className="text-success font-semibold mb-2">Great News!</p>
              <p className="text-muted-foreground">No customers are currently at risk of churning.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => {
                const riskLevel = getRiskLevel(customer.churn_risk_score);
                return (
                  <Card key={customer.customer_id} className={`border-2 hover:shadow-xl transition-all duration-300 group ${
                    customer.churn_risk_score >= 70 ? 'border-red-200/50 bg-gradient-to-br from-red-50 to-white' : 'border-amber-200/50 bg-gradient-to-br from-amber-50 to-white'
                  }`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${
                            customer.churn_risk_score >= 70 ? 'bg-gradient-to-br from-red-600 to-rose-600' : 'bg-gradient-to-br from-amber-600 to-orange-600'
                          }`}>
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg text-slate-900 truncate">
                                {customer.customer_name}
                              </h3>
                              <Badge className={`text-xs font-bold ${
                                riskLevel.label === 'Critical' || riskLevel.label === 'High' 
                                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-0' 
                                  : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0'
                              }`}>
                                {riskLevel.label} Risk - {customer.churn_risk_score}%
                              </Badge>
                              <Badge variant="outline" className="text-xs border-2 font-semibold">
                                {customer.rfm_segment}
                              </Badge>
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Last Purchase</p>
                                <p className="text-sm font-semibold">
                                  {customer.recency_days} days ago
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(customer.last_purchase_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Orders</p>
                                <p className="text-sm font-semibold">{customer.frequency_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Value</p>
                                <p className="text-sm font-semibold">${customer.monetary_value.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Order</p>
                                <p className="text-sm font-semibold">
                                  ${customer.frequency_count > 0 
                                    ? (customer.monetary_value / customer.frequency_count).toFixed(2) 
                                    : '0.00'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
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
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-slate-200/50 bg-gradient-to-r from-white to-amber-50/30">
          <div className="text-sm font-medium text-slate-700">
            <span className="font-bold">{customers.length}</span> at-risk customers • <span className="font-bold">${statistics?.total_revenue_at_risk?.toFixed(2) || 0}</span> at risk
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-2 hover:bg-slate-50">Close</Button>
            <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg">
              <Mail className="h-4 w-4 mr-2" />
              Create Win-Back Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
