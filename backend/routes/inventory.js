const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Groq client
const groq = axios.create({
    baseURL: 'https://api.groq.com/openai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

/**
 * GET /api/inventory/optimize/:businessId
 * Run AI-powered inventory optimization for a specific business
 */
router.get('/optimize/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ error: 'Business not found or access denied' });
        }

        // Fetch sales summary data
        const { data: salesData, error: salesError } = await supabase
            .from('vw_product_sales_summary')
            .select('*')
            .eq('business_id', businessId);

        if (salesError) {
            console.error('Sales data error:', salesError);
        }

        // Fetch all products
        const { data: productData, error: productError } = await supabase
            .from('product')
            .select('*')
            .eq('business_id', businessId);

        if (productError) {
            console.error('Product data error:', productError);
        }

        // Fetch available capital
        const { data: capitalData, error: capitalError } = await supabase
            .from('vw_business_capital')
            .select('*')
            .eq('business_id', businessId)
            .single();

        if (capitalError) {
            console.error('Capital data error:', capitalError);
        }

        // Fetch supplier lead times
        const { data: leadTimeData, error: leadTimeError } = await supabase
            .from('vw_supplier_lead_times')
            .select('*')
            .eq('business_id', businessId);

        if (leadTimeError) {
            console.error('Lead time data error:', leadTimeError);
        }

        // Fetch co-purchase data for bundles
        const { data: coPurchaseData, error: coPurchaseError } = await supabase
            .from('vw_product_copurchases')
            .select('*')
            .eq('business_id', businessId)
            .order('times_purchased_together', { ascending: false })
            .limit(20);

        if (coPurchaseError) {
            console.error('Co-purchase data error:', coPurchaseError);
        }

        // Build prompt for Groq
        const prompt = `You are an advanced AI inventory optimization expert. Analyze the following merchandising business data and provide actionable recommendations.

**Business Context:**
- Business: ${business.name}
- Available Capital: $${capitalData?.total_net_capital || 0}

**Product Inventory (${productData?.length || 0} products):**
${JSON.stringify(productData?.slice(0, 50) || [], null, 2)}

**Sales History:**
${JSON.stringify(salesData?.slice(0, 50) || [], null, 2)}

**Supplier Lead Times:**
${JSON.stringify(leadTimeData || [], null, 2)}

**Co-Purchased Products:**
${JSON.stringify(coPurchaseData?.slice(0, 10) || [], null, 2)}

**Your Tasks:**

1. **Demand Forecasting**: Predict 30-day demand for each product based on sales history. Consider seasonality and trends.

2. **Reorder Optimization**: Calculate optimal reorder points and quantities considering:
   - Lead times from suppliers
   - Available capital constraint
   - Demand variability
   - Storage capacity (if applicable)

3. **Dead Stock Identification**: Flag products with no sales in 60+ days and suggest clearance discount percentages (5-30% off) based on holding cost and urgency.

4. **Bundle Recommendations**: Suggest 3-5 profitable product bundles based on:
   - Co-purchase patterns
   - Complementary product categories
   - Margin optimization
   - Inventory clearance opportunities

5. **Seasonal Transitions**: If applicable, recommend seasonal stock adjustments.

**Output Format (STRICT JSON):**
{
  "forecast": [
    {
      "product_id": "string",
      "product_name": "string",
      "demand_forecast_units": number,
      "confidence_score": number (0-1)
    }
  ],
  "reorder_plan": [
    {
      "product_id": "string",
      "product_name": "string",
      "current_status": "string",
      "reorder_point": number,
      "reorder_quantity": number,
      "estimated_cost": number,
      "priority": "high|medium|low",
      "rationale": "string"
    }
  ],
  "dead_stock": [
    {
      "product_id": "string",
      "product_name": "string",
      "last_sale_date": "string",
      "clearance_discount": number (percentage),
      "estimated_loss": number,
      "action": "string"
    }
  ],
  "bundles": [
    {
      "bundle_name": "string",
      "product_ids": ["string"],
      "product_names": ["string"],
      "bundle_price": number,
      "estimated_margin": number,
      "rationale": "string",
      "copurchase_frequency": number
    }
  ],
  "seasonal_recommendations": [
    {
      "action": "increase|decrease|maintain",
      "category": "string",
      "percentage_change": number,
      "rationale": "string"
    }
  ],
  "summary": {
    "total_capital_required": number,
    "expected_roi": number,
    "risk_level": "low|medium|high",
    "key_insights": ["string"]
  }
}

Return ONLY valid JSON, no markdown or explanations.`;

        // Call Groq API
        const groqResponse = await groq.post('/chat/completions', {
            model: 'mixtral-8x7b-32768',
            messages: [
                {
                    role: 'system',
                    content: 'You are a precise inventory optimization AI. Always return valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 8000
        });

        const aiResponse = groqResponse.data.choices[0].message.content;
        
        // Parse AI response
        let optimizationResults;
        try {
            // Try to extract JSON if wrapped in markdown
            const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                             aiResponse.match(/```\n?([\s\S]*?)\n?```/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
            optimizationResults = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('AI Response:', aiResponse);
            return res.status(500).json({ 
                error: 'Failed to parse AI response',
                raw_response: aiResponse 
            });
        }

        // Store results in database
        const optimizationRecords = [];
        
        // Store forecast data
        if (optimizationResults.forecast) {
            for (const item of optimizationResults.forecast) {
                optimizationRecords.push({
                    business_id: businessId,
                    product_id: item.product_id,
                    forecast_units: item.demand_forecast_units,
                    forecast_period_days: 30,
                    confidence_score: item.confidence_score * 100
                });
            }
        }

        // Store reorder plan
        if (optimizationResults.reorder_plan) {
            for (const item of optimizationResults.reorder_plan) {
                const existingRecord = optimizationRecords.find(r => r.product_id === item.product_id);
                if (existingRecord) {
                    existingRecord.reorder_point = item.reorder_point;
                    existingRecord.reorder_quantity = item.reorder_quantity;
                    existingRecord.rationale = item.rationale;
                } else {
                    optimizationRecords.push({
                        business_id: businessId,
                        product_id: item.product_id,
                        reorder_point: item.reorder_point,
                        reorder_quantity: item.reorder_quantity,
                        rationale: item.rationale
                    });
                }
            }
        }

        // Store dead stock recommendations
        if (optimizationResults.dead_stock) {
            for (const item of optimizationResults.dead_stock) {
                const existingRecord = optimizationRecords.find(r => r.product_id === item.product_id);
                if (existingRecord) {
                    existingRecord.clearance_discount = item.clearance_discount;
                } else {
                    optimizationRecords.push({
                        business_id: businessId,
                        product_id: item.product_id,
                        clearance_discount: item.clearance_discount
                    });
                }
            }
        }

        // Save to database
        if (optimizationRecords.length > 0) {
            const { error: insertError } = await supabase
                .from('inventory_optimization')
                .upsert(optimizationRecords, {
                    onConflict: 'business_id,product_id'
                });

            if (insertError) {
                console.error('Error saving optimization results:', insertError);
            }
        }

        // Return results
        res.json({
            success: true,
            business: {
                id: business.id,
                name: business.name
            },
            optimization: optimizationResults,
            metadata: {
                products_analyzed: productData?.length || 0,
                sales_records: salesData?.length || 0,
                available_capital: capitalData?.total_net_capital || 0,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Inventory optimization error:', error);
        res.status(500).json({ 
            error: 'Failed to optimize inventory',
            message: error.message 
        });
    }
});

/**
 * GET /api/inventory/results/:businessId
 * Get stored optimization results for a business
 */
router.get('/results/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ error: 'Business not found or access denied' });
        }

        // Fetch latest optimization results
        const { data: results, error } = await supabase
            .from('inventory_optimization')
            .select(`
                *,
                product:product_id (
                    product_id,
                    product_name,
                    price,
                    selling_price,
                    status,
                    category_id,
                    brand_id
                )
            `)
            .eq('business_id', businessId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching results:', error);
            return res.status(500).json({ error: 'Failed to fetch results' });
        }

        res.json({
            success: true,
            results: results || [],
            count: results?.length || 0
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch optimization results' });
    }
});

/**
 * GET /api/inventory/stats/:businessId
 * Get inventory statistics for a business
 */
router.get('/stats/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ error: 'Business not found or access denied' });
        }

        // Get product count
        const { count: totalProducts } = await supabase
            .from('product')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        // Get dead stock count
        const { data: salesSummary } = await supabase
            .from('vw_product_sales_summary')
            .select('is_dead_stock')
            .eq('business_id', businessId)
            .eq('is_dead_stock', true);

        // Get reorder recommendations
        const { data: reorderItems } = await supabase
            .from('inventory_optimization')
            .select('reorder_point')
            .eq('business_id', businessId)
            .not('reorder_point', 'is', null)
            .gt('expires_at', new Date().toISOString());

        res.json({
            success: true,
            stats: {
                total_items: totalProducts || 0,
                need_reorder: reorderItems?.length || 0,
                dead_stock: salesSummary?.length || 0,
                optimal_stock: (totalProducts || 0) - (salesSummary?.length || 0) - (reorderItems?.length || 0)
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
});

module.exports = router;
