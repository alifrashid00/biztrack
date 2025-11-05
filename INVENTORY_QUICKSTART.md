# Quick Start Guide - Inventory Management

## Starting the Application

### Backend
```bash
cd backend
npm run dev
```
Server runs on: `http://localhost:5000`

### Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:3000`

## Using the Inventory Feature

### Step 1: Login
1. Navigate to `http://localhost:3000/auth/login`
2. Login with your credentials
3. If you don't have an account, register at `/auth/register`

### Step 2: Create/Select Business
1. Go to `http://localhost:3000/businesses`
2. Create a new business or select an existing one
3. Make sure your business has products in the database

### Step 3: Access Inventory Management
1. Navigate to `http://localhost:3000/inventory`
2. Select your business from the dropdown in the top-right corner
3. View real-time inventory statistics

### Step 4: Run AI Optimization
1. Click the "Run Optimization" button
2. Wait for AI analysis (usually 10-30 seconds)
3. Review the comprehensive results:
   - **Summary**: Capital required, ROI, risk level
   - **Bundles**: Product combination suggestions
   - **Dead Stock**: Items to clear with discount recommendations
   - **Seasonal**: Adjustments based on trends

### Step 5: Review Alerts
1. Scroll to the "Inventory Intelligence" section
2. View prioritized alerts for:
   - Items needing reorder
   - Dead stock warnings
   - Demand forecasts
   - Optimal stock confirmations

## Sample Data Requirements

For the best optimization results, ensure your business has:
- ✅ At least 10-20 products in the `product` table
- ✅ Sales history in the `sale` and `sale_item` tables
- ✅ Supplier information with lead times
- ✅ Capital/financial data in the `capital` table

## Testing Different Scenarios

### Test 1: New Business with No Data
**Expected**: Message prompting to add products and sales data

### Test 2: Business with Products but No Sales
**Expected**: Optimization runs but may suggest conservative forecasts

### Test 3: Business with Complete Data
**Expected**: Comprehensive recommendations including:
- Accurate demand forecasts
- Specific reorder quantities
- Bundle opportunities based on co-purchases
- Dead stock identification
- Seasonal recommendations

## Troubleshooting

### Issue: "No documents found" or similar errors
**Solution**: Ensure your business has data in the database tables

### Issue: Optimization takes too long
**Solution**: Check Groq API status and your API key

### Issue: Stats show 0 for all metrics
**Solution**: Verify database views are created (check migration files)

### Issue: "Failed to fetch businesses"
**Solution**: Check backend is running and authentication token is valid

## API Endpoints for Manual Testing

### Get Inventory Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory/stats/BUSINESS_ID
```

### Run Optimization
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory/optimize/BUSINESS_ID
```

### Get Stored Results
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory/results/BUSINESS_ID
```

## Features Overview

### Stats Cards
- **Total Items**: Count of all products
- **Need Reorder**: Products below reorder point
- **Dead Stock**: Products with no recent sales
- **Optimal Stock**: Products at good levels

### AI Optimization Results
- **Demand Forecasting**: 30-day predictions
- **Reorder Planning**: When and how much to order
- **Bundle Recommendations**: Profitable combinations
- **Dead Stock Clearance**: Discount strategies
- **Seasonal Adjustments**: Category-level changes

### Visual Indicators
- 🔴 Red: High priority (dead stock, urgent reorders)
- 🟡 Yellow: Medium priority (upcoming reorders)
- 🟢 Green: Low priority (optimal stock, forecasts)

## Next Steps

After reviewing optimization results, you can:
1. Create recommended bundles in your inventory system
2. Place orders for products needing restock
3. Apply clearance discounts to dead stock
4. Adjust inventory levels for seasonal changes
5. Track changes over time by running optimization regularly

## Performance Tips

- Run optimization during off-peak hours for faster results
- Optimization results are cached for efficiency
- Stats refresh automatically when switching businesses
- Results expire after a set period to ensure freshness
