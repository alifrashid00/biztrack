const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// Helpers
function monthKey(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function exponentialSmoothing(series, alpha = 0.3) {
    // series: [{ key: 'YYYY-MM', value: number }...] sorted by time key
    if (!series || series.length === 0) {
        return { forecast: 0, confidence: 0.5 };
    }
    let S = series[0].value;
    for (let i = 1; i < series.length; i++) {
        const y = series[i].value;
        S = alpha * y + (1 - alpha) * S;
    }
    const forecast = S;

    // Confidence proxy from coefficient of variation
    const values = series.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(values.length - 1, 1);
    const std = Math.sqrt(variance);
    const cv = mean ? std / mean : 1;
    const confidence = Math.max(0.5, Math.min(0.95, 0.95 - 0.35 * cv));

    return { forecast: Math.max(0, Math.round(forecast)), confidence: Number(confidence.toFixed(2)) };
}

// GET /api/forecast/generate/:businessId
router.get('/generate/:businessId', authenticateUser, async (req, res) => {
    const businessId = req.params.businessId;
    const userId = req.user.id;

    try {
        // Verify business ownership
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name, user_id')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(403).json({ error: 'Access denied or business not found' });
        }

        // Fetch orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('sales_order')
            .select('sales_order_id, order_date')
            .eq('business_id', businessId);

        if (ordersError) {
            return res.status(500).json({ error: 'Failed to load sales orders', details: ordersError });
        }

        // Fetch order items
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('sales_order_items')
            .select('sales_order_id, product_id, line_total')
            .eq('business_id', businessId);

        if (itemsError) {
            return res.status(500).json({ error: 'Failed to load sales order items', details: itemsError });
        }

        if (!orders?.length || !items?.length) {
            return res.json({ success: true, business: { id: business.id, name: business.name }, forecast: [] });
        }

        // Index orders by id for dates
        const orderIndex = new Map();
        for (const o of orders) {
            orderIndex.set(o.sales_order_id, o.order_date);
        }

        // Collect product IDs to fetch selling price and name
        const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean)));

        let productInfo = new Map(); // id -> { name, price }
        if (productIds.length > 0) {
            const { data: products, error: productsError } = await supabaseAdmin
                .from('product')
                .select('product_id, product_name, selling_price')
                .eq('business_id', businessId)
                .in('product_id', productIds);

            if (productsError) {
                // Proceed without names/prices
                productInfo = new Map();
            } else {
                productInfo = new Map(products.map(p => [p.product_id, { name: p.product_name, price: Number(p.selling_price) || 0 }]));
            }
        }

        // Group monthly estimated units per product
        const productMonthly = new Map(); // product_id -> Map(monthKey -> sumUnits)
        for (const it of items) {
            const dateStr = orderIndex.get(it.sales_order_id);
            if (!dateStr) continue;
            const mk = monthKey(dateStr);
            if (!mk) continue;

            const pInfo = productInfo.get(it.product_id) || { price: 0 };
            const price = pInfo.price;
            const lineTotal = Number(it.line_total) || 0;
            const approxUnits = price > 0 ? Math.max(0, lineTotal / price) : 1; // fallback

            if (!productMonthly.has(it.product_id)) productMonthly.set(it.product_id, new Map());
            const mm = productMonthly.get(it.product_id);
            mm.set(mk, (mm.get(mk) || 0) + approxUnits);
        }

        // Build time series and compute forecasts
        const forecasts = [];
        for (const [pid, monthlyMap] of productMonthly.entries()) {
            const series = Array.from(monthlyMap.entries())
                .map(([k, v]) => ({ key: k, value: v }))
                .sort((a, b) => (a.key < b.key ? -1 : 1));

            const { forecast, confidence } = exponentialSmoothing(series, 0.3);
            const pInfo = productInfo.get(pid) || {};
            forecasts.push({
                product_id: pid,
                product_name: pInfo.name || pid,
                demand_forecast_units: forecast,
                confidence_score: confidence
            });
        }

        forecasts.sort((a, b) => b.demand_forecast_units - a.demand_forecast_units);

        return res.json({
            success: true,
            business: { id: business.id, name: business.name },
            forecast: forecasts
        });
    } catch (e) {
        console.error('[FORECAST] Error:', e);
        return res.status(500).json({ error: 'Forecast generation failed', details: String(e?.message || e) });
    }
});

module.exports = router;
