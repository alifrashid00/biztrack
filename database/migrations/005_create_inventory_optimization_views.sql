-- Migration: 005_create_inventory_optimization_views.sql
-- Description: Creates views and table for AI-powered inventory optimization

-- View 1: Product Sales Summary (for demand forecasting)
CREATE OR REPLACE VIEW public.vw_product_sales_summary AS
SELECT 
    soi.business_id,
    soi.product_id,
    p.product_name,
    p.price AS cost_price,
    p.selling_price,
    p.category_id,
    p.brand_id,
    p.stored_location,
    p.status,
    COALESCE(SUM(soi.line_total / NULLIF(p.selling_price, 0)), 0) AS total_units_sold,
    COUNT(DISTINCT so.sales_order_id) AS total_orders,
    MIN(so.order_date) AS first_sale,
    MAX(so.order_date) AS last_sale,
    COALESCE(SUM(soi.line_total), 0) AS total_revenue,
    CASE 
        WHEN MAX(so.order_date) < NOW() - INTERVAL '60 days' THEN true
        WHEN MAX(so.order_date) IS NULL THEN true
        ELSE false
    END AS is_dead_stock
FROM public.product p
LEFT JOIN public.sales_order_items soi ON p.product_id = soi.product_id
LEFT JOIN public.sales_order so ON soi.sales_order_id = so.sales_order_id
GROUP BY soi.business_id, soi.product_id, p.product_name, p.price, p.selling_price, 
         p.category_id, p.brand_id, p.stored_location, p.status;

-- View 2: Supplier Lead Time Analysis
CREATE OR REPLACE VIEW public.vw_supplier_lead_times AS
SELECT 
    po.business_id,
    po.supplier_id,
    s.supplier_name,
    AVG(po.delivery_date - po.order_date::date) AS avg_lead_time_days,
    MIN(po.delivery_date - po.order_date::date) AS min_lead_time_days,
    MAX(po.delivery_date - po.order_date::date) AS max_lead_time_days,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN po.status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders
FROM public.purchase_order po
JOIN public.supplier s ON po.supplier_id = s.supplier_id
WHERE po.delivery_date IS NOT NULL
GROUP BY po.business_id, po.supplier_id, s.supplier_name;

-- View 3: Available Capital per Business
CREATE OR REPLACE VIEW public.vw_business_capital AS
SELECT 
    business_id,
    SUM(net_capital) AS total_net_capital,
    SUM(current_capital) AS total_current_capital,
    MAX(calculation_date) AS last_calculation_date
FROM public.investors_capital
GROUP BY business_id;

-- View 4: Product Purchase History (for reorder optimization)
CREATE OR REPLACE VIEW public.vw_product_purchase_history AS
SELECT 
    poi.business_id,
    pb.brand_id,
    pb.brand_name,
    pb.unit_price,
    po.supplier_id,
    s.supplier_name,
    AVG(poi.unit_cost) AS avg_unit_cost,
    SUM(poi.quantity_ordered) AS total_quantity_ordered,
    COUNT(DISTINCT po.purchase_order_id) AS total_purchase_orders,
    MAX(po.order_date) AS last_order_date
FROM public.purchase_order_items poi
JOIN public.purchase_order po ON poi.purchase_order_id = po.purchase_order_id
JOIN public.product_brand pb ON poi.product_brand_id = pb.brand_id
JOIN public.supplier s ON po.supplier_id = s.supplier_id
GROUP BY poi.business_id, pb.brand_id, pb.brand_name, pb.unit_price, po.supplier_id, s.supplier_name;

-- View 5: Co-purchased Products (for bundle recommendations)
CREATE OR REPLACE VIEW public.vw_product_copurchases AS
SELECT 
    soi1.business_id,
    soi1.product_id AS product_id_1,
    p1.product_name AS product_name_1,
    soi2.product_id AS product_id_2,
    p2.product_name AS product_name_2,
    COUNT(DISTINCT soi1.sales_order_id) AS times_purchased_together,
    SUM(soi1.line_total + soi2.line_total) AS combined_revenue
FROM public.sales_order_items soi1
JOIN public.sales_order_items soi2 
    ON soi1.sales_order_id = soi2.sales_order_id 
    AND soi1.product_id < soi2.product_id
JOIN public.product p1 ON soi1.product_id = p1.product_id
JOIN public.product p2 ON soi2.product_id = p2.product_id
GROUP BY soi1.business_id, soi1.product_id, p1.product_name, soi2.product_id, p2.product_name
HAVING COUNT(DISTINCT soi1.sales_order_id) >= 2
ORDER BY times_purchased_together DESC;

-- Table: Store AI optimization results
CREATE TABLE IF NOT EXISTS public.inventory_optimization (
    optimization_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    product_id VARCHAR(100) REFERENCES public.product(product_id),
    forecast_units INTEGER,
    forecast_period_days INTEGER DEFAULT 30,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    clearance_discount DECIMAL(5,2),
    bundle_suggestion TEXT,
    rationale TEXT,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_optimization_business 
    ON public.inventory_optimization(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_optimization_product 
    ON public.inventory_optimization(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_optimization_created 
    ON public.inventory_optimization(created_at DESC);
