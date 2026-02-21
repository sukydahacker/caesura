# Printify Integration Setup Guide

## Step 1: Create Printify Account
1. Go to https://printify.com/
2. Sign up for a free account
3. Complete the registration process

## Step 2: Create Your Shop
1. Log in to Printify dashboard
2. Click "My Shops" in the sidebar
3. Click "Add Shop"
4. Select "Custom" or "API" integration type
5. Give your shop a name (e.g., "Caesura Marketplace")
6. Save the shop

## Step 3: Get Your Shop ID
1. In the Printify dashboard, go to "My Shops"
2. Click on your newly created shop
3. Copy the Shop ID from the URL: `https://printify.com/app/stores/{SHOP_ID}`
   - Example: If URL is `https://printify.com/app/stores/12345`, your shop ID is `12345`

## Step 4: Get Your API Token
1. In the Printify dashboard, click your profile icon (top right)
2. Go to "Connections" or "API"
3. Click "Generate Token" or "Create API Token"
4. Copy the generated token (save it securely - you won't see it again)

## Step 5: Add Credentials to Backend
1. Open `/app/backend/.env`
2. Add these lines:
   ```
   PRINTIFY_API_TOKEN=your_api_token_here
   PRINTIFY_SHOP_ID=your_shop_id_here
   ```
3. Save the file
4. Restart the backend: `sudo supervisorctl restart backend`

## Step 6: Verify Integration
After adding credentials, the admin panel will:
- Automatically fetch available Printify blueprints (T-shirts, Hoodies)
- Display product creation options
- Enable order placement to Printify

## Printify API Documentation
- Base URL: `https://api.printify.com/v1/`
- Docs: https://developers.printify.com/

## Important Notes
- **Production Costs**: Printify charges per item based on blueprint, size, and color
- **Shipping**: Handled by Printify, costs vary by destination
- **Order Flow**: 
  1. Customer orders on Caesura → 
  2. Backend creates Printify order → 
  3. Printify prints and ships → 
  4. Tracking info synced back to Caesura

## Testing Mode
- Without API credentials, the system will use **mock mode**
- Mock mode simulates Printify responses for development
- No real products are created or orders placed in mock mode

## Next Steps
1. Add your credentials to `.env`
2. Go to Admin Panel → Printify Setup
3. Sync blueprints and configure pricing rules
4. Start approving designs!