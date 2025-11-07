"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertCircle, Star, Loader2, Mail, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Segment {
  rfm_segment: string;
  customer_count: number;
  total_segment_revenue: number;
  avg_customer_value: number;
  avg_purchase_frequency: number;
  avg_days_since_purchase: number;
  avg_churn_risk: number;
}

interface CustomerInsightsProps {
  businessId: string;
  onViewSegment: (segment: string) => void;
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

const getSegmentIcon = (segment: string) => {
  if (segment.includes("Champions")) return Star;
  if (segment.includes("At Risk") || segment.includes("Hibernating") || segment.includes("Cant Lose")) return AlertCircle;
  if (segment.includes("Loyal") || segment.includes("Potential")) return Users;
  return TrendingUp;
};

export const CustomerInsights = ({ businessId, onViewSegment }: CustomerInsightsProps) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (businessId) {
      fetchSegments();
    }
  }, [businessId]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/segments/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer segments");

      const data = await response.json();
      setSegments(data.segments || []);
      setTotalRevenue(data.total_revenue || 0);
    } catch (err) {
      console.error("Error fetching customer segments:", err);
      setError("Failed to load customer insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Intelligence</CardTitle>
          <CardDescription>RFM segmentation with automated retention strategies</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Customer Intelligence</CardTitle>
          <CardDescription>RFM segmentation with automated retention strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-4">{error}</p>
          <Button onClick={fetchSegments} className="w-full">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Intelligence</CardTitle>
          <CardDescription>RFM segmentation with automated retention strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No customer data available. Add customer sales data to see insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-slate-50 shadow-xl">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Customer Intelligence</CardTitle>
            <CardDescription className="text-slate-600 font-medium">RFM segmentation with automated retention strategies</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {segments.map((segment, index) => {
            const Icon = getSegmentIcon(segment.rfm_segment);
            const percentage = totalRevenue > 0 
              ? (segment.total_segment_revenue / totalRevenue * 100) 
              : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSegmentColor(segment.rfm_segment) as any}>
                      {segment.rfm_segment}
                    </Badge>
                    <span className="text-muted-foreground">
                      {segment.customer_count} customers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      ${segment.total_segment_revenue.toFixed(2)}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onViewSegment(segment.rfm_segment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Avg: ${segment.avg_customer_value.toFixed(2)}/customer</span>
                  <span>{segment.avg_purchase_frequency.toFixed(1)} orders</span>
                  <span>{Math.round(segment.avg_days_since_purchase)} days ago</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* <div className="space-y-6 pt-4 border-t-2 border-slate-200/50">
          <div className="flex items-start space-x-4 p-5 rounded-2xl border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-white shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-slate-900">Top Customers</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">{segments.find(s => s.rfm_segment === "Champions")?.customer_count || 0}</span> champions 
                generating <span className="font-bold">${segments.find(s => s.rfm_segment === "Champions")?.total_segment_revenue.toFixed(2) || 0}</span>
              </p>
              <p className="text-xs font-semibold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Keep them engaged with exclusive offers</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-5 rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-amber-50 to-white shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-slate-900">Churn Risk</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">{segments.filter(s => 
                  s.rfm_segment.includes("At Risk") || 
                  s.rfm_segment.includes("Cant Lose") ||
                  s.rfm_segment.includes("Hibernating")
                ).reduce((sum, s) => sum + s.customer_count, 0)}</span> customers need attention
              </p>
              <p className="text-xs font-semibold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Run AI analysis for personalized win-back strategies</p>
            </div>
          </div> */}

          {/* <div className="flex items-start space-x-4 p-5 rounded-2xl border-2 border-blue-200/50 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-slate-900">Growth Opportunity</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">{segments.find(s => s.rfm_segment === "Potential Loyalists")?.customer_count || 0}</span> potential 
                loyalists showing promise
              </p>
              <p className="text-xs font-semibold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">Upsell and cross-sell opportunities available</p>
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
};
