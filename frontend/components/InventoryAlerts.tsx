"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, PackageCheck, Zap, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InventoryAlert {
  product_id: string;
  product_name: string;
  type: "reorder" | "dead" | "forecast" | "optimal";
  message: string;
  action: string;
  priority: "high" | "medium" | "low";
  reorder_point?: number;
  reorder_quantity?: number;
  clearance_discount?: number;
  forecast_units?: number;
}

interface InventoryAlertsProps {
  businessId: string;
}

const priorityColors = {
  high: "destructive",
  medium: "warning",
  low: "default"
} as const;

const getAlertIcon = (type: string) => {
  switch (type) {
    case "reorder":
      return AlertTriangle;
    case "dead":
      return TrendingDown;
    case "forecast":
      return Zap;
    case "optimal":
      return PackageCheck;
    default:
      return PackageCheck;
  }
};

const getAlertColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "warning";
    default:
      return "success";
  }
};

export const InventoryAlerts = ({ businessId }: InventoryAlertsProps) => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId) {
      fetchAlerts();
    }
  }, [businessId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/inventory/results/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch inventory alerts");

      const data = await response.json();
      
      // Transform the results into alerts
      const transformedAlerts: InventoryAlert[] = [];
      
      if (data.results && data.results.length > 0) {
        data.results.forEach((result: any) => {
          const product = result.product || {};
          const productName = product.product_name || "Unknown Product";
          
          // Check for reorder alerts
          if (result.reorder_point && result.reorder_quantity) {
            transformedAlerts.push({
              product_id: result.product_id,
              product_name: productName,
              type: "reorder",
              message: `Stock below reorder point`,
              action: `Order ${result.reorder_quantity} units`,
              priority: result.reorder_priority || "medium",
              reorder_point: result.reorder_point,
              reorder_quantity: result.reorder_quantity,
            });
          }
          
          // Check for dead stock
          if (result.clearance_discount && result.clearance_discount > 0) {
            transformedAlerts.push({
              product_id: result.product_id,
              product_name: productName,
              type: "dead",
              message: "Dead stock detected",
              action: `Clear at ${result.clearance_discount}% discount`,
              priority: "medium",
              clearance_discount: result.clearance_discount,
            });
          }
          
          // Check for forecast
          if (result.forecast_units) {
            transformedAlerts.push({
              product_id: result.product_id,
              product_name: productName,
              type: "forecast",
              message: `Forecasted demand: ${result.forecast_units} units`,
              action: `Plan for ${result.forecast_period_days || 30} days`,
              priority: "low",
              forecast_units: result.forecast_units,
            });
          }
        });
      }
      
      setAlerts(transformedAlerts);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load inventory alerts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Intelligence</CardTitle>
        <CardDescription>AI-powered stock optimization and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alerts available. Run optimization to generate insights.
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {alerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const color = getAlertColor(alert.priority);
                
                return (
                  <div
                    key={`${alert.product_id}-${index}`}
                    className="flex items-start space-x-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-${color}/10`}>
                      <Icon className={`h-5 w-5 text-${color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{alert.product_name}</p>
                        <Badge variant={priorityColors[alert.priority]}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs font-medium text-primary">{alert.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
